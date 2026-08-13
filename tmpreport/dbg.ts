import { selectConsultantFeatures } from "../src/lib/admin/consultant-library";
for (const [b,p,c] of [["Travel agent / tour","Reservasi paket wisata masih manual lewat chat, customer sulit memesan","1 kantor, 4 staff"],["Agen properti","Daftar listing properti sulit disampaikan ke calon pembeli, belum ada website","5 marketing"]] as const) {
  const picks = selectConsultantFeatures({businessText:b,problemText:p,context:`${p} ${c}`,scaleText:c,allowEnterprise:false,limit:10});
  console.log(b, picks.map(x=>`${x.id}/${x.role}/${x.score}/${x.reasons.join("|")}`));
}
