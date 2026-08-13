/**
 * Biometric quick unlock (device-local).
 *
 * WebAuthn platform authenticator is used purely as a LOCAL gate: there is no
 * server-side passkey verification. After the biometric assertion succeeds we
 * decrypt the Supabase session that was stored on this device and restore it.
 * Losing the device data simply means logging in with the password again.
 */

const DB_NAME = "kerjaku-auth";
const DB_VERSION = 1;
const STORE = "biometric";
const RECORD_KEY = "quick-unlock";

type UnlockRecord = {
  credentialId: ArrayBuffer;
  email: string;
  iv: ArrayBuffer;
  payload: ArrayBuffer;
  key: CryptoKey;
  createdAt: number;
};

export type StoredSession = {
  access_token: string;
  refresh_token: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

async function readRecord(): Promise<UnlockRecord | null> {
  if (!isBrowser()) return null;
  try {
    const db = await openDb();
    return await new Promise<UnlockRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(RECORD_KEY);
      req.onsuccess = () => resolve((req.result as UnlockRecord | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("Gagal membaca data perangkat"));
    });
  } catch {
    return null;
  }
}

async function writeRecord(record: UnlockRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Gagal menyimpan data perangkat"));
  });
}

export async function disableBiometricUnlock(): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

/** True when this browser/device exposes a built-in biometric authenticator. */
export async function isBiometricSupported(): Promise<boolean> {
  if (!isBrowser()) return false;
  if (!("credentials" in navigator) || typeof PublicKeyCredential === "undefined") return false;
  if (!window.isSecureContext) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Returns the enrolled email when quick unlock is armed on this device. */
export async function getEnrolledEmail(): Promise<string | null> {
  const record = await readRecord();
  return record?.email ?? null;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

function rpId(): string {
  return window.location.hostname;
}

/**
 * Registers the device biometric and stores the current session encrypted.
 * Must be called right after a successful password login.
 */
export async function enrollBiometricUnlock(params: {
  email: string;
  session: StoredSession;
}): Promise<void> {
  if (!isBrowser()) throw new Error("Tidak tersedia di perangkat ini.");
  if (!(await isBiometricSupported())) throw new Error("Perangkat ini tidak mendukung biometrik.");

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: "KERJAKU Business OS", id: rpId() },
      user: {
        id: randomBytes(16),
        name: params.email,
        displayName: params.email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Pendaftaran biometrik dibatalkan.");

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  const iv = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(params.session));
  const payload = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  await writeRecord({
    credentialId: credential.rawId,
    email: params.email,
    iv: iv.buffer,
    payload,
    key,
    createdAt: Date.now(),
  });
}

/**
 * Asks for the fingerprint, then returns the stored session for restoration.
 * Throws when the assertion fails; stale data is purged automatically.
 */
export async function unlockWithBiometric(): Promise<StoredSession> {
  const record = await readRecord();
  if (!record) throw new Error("Buka cepat belum aktif di perangkat ini.");

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: rpId(),
      allowCredentials: [{ type: "public-key", id: record.credentialId }],
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!assertion) throw new Error("Verifikasi sidik jari dibatalkan.");

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: record.iv },
      record.key,
      record.payload,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as StoredSession;
  } catch {
    await disableBiometricUnlock();
    throw new Error("Data buka cepat rusak. Silakan masuk dengan password.");
  }
}
