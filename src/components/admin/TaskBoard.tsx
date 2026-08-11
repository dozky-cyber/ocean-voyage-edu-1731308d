import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Chip, GlassCard, SectionCard } from "@/components/admin/ui";
import { isOverdue } from "@/lib/admin/ops";
import {
  formatDate,
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskPriorityClass,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/admin/projects";
import { cn } from "@/lib/utils";

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  notes: string | null;
};

export type BoardComment = {
  id: string;
  task_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type BoardMember = { id: string; name: string; role: string };

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none transition focus:border-primary/60";

export function TaskBoard({
  tasks,
  comments,
  members,
  onCreate,
  onUpdate,
  onStatus,
  onDelete,
  onComment,
  busy,
}: {
  tasks: BoardTask[];
  comments: BoardComment[];
  members: BoardMember[];
  onCreate: (input: {
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
  }) => void;
  onUpdate: (input: BoardTask & { priority: string; status: string }) => void;
  onStatus: (input: { id: string; status: TaskStatus }) => void;
  onDelete: (id: string) => void;
  onComment: (input: { taskId: string; body: string }) => void;
  busy: boolean;
}) {
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("Semua");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [due, setDue] = useState("");
  const [description, setDescription] = useState("");

  const assignees = ["Semua", "Belum ditugaskan", ...members.map((m) => m.name)];
  const visible = tasks.filter((task) => {
    if (filter === "Semua") return true;
    if (filter === "Belum ditugaskan") return !task.assignee?.trim();
    return (task.assignee ?? "").trim().toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
          Filter
        </span>
        {assignees.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setFilter(name)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.7rem] transition",
              filter === name
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {TASK_STATUSES.map((status) => {
          const column = visible.filter((task) => task.status === status);
          return (
            <div
              key={status}
              className="min-w-0 rounded-3xl border border-border/40 bg-card/30 p-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-foreground">{status}</p>
                <span className="shrink-0 rounded-full bg-muted/30 px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                  {column.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {column.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/40 p-3 text-[0.7rem] text-muted-foreground">
                    Kosong
                  </p>
                ) : (
                  column.map((task) => {
                    const late = isOverdue(task.due_date, task.status);
                    const taskComments = comments.filter((c) => c.task_id === task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-2xl border bg-background/40 p-3 transition",
                          late ? "border-destructive/40" : "border-border/40",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenTask(openTask === task.id ? null : task.id)}
                          className="block w-full text-left"
                        >
                          <p className="text-sm font-medium leading-snug text-foreground">
                            {task.title}
                          </p>
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Chip className={taskPriorityClass(task.priority)}>{task.priority}</Chip>
                          <Chip
                            className={cn(
                              "border-border/60 bg-muted/20 text-muted-foreground",
                              late && "border-destructive/40 bg-destructive/10 text-destructive",
                            )}
                          >
                            {late ? "Overdue " : "Due "}
                            {formatDate(task.due_date)}
                          </Chip>
                        </div>
                        <p className="mt-2 truncate text-[0.7rem] text-muted-foreground">
                          {task.assignee?.trim() || "Belum ditugaskan"}
                          {taskComments.length > 0 ? ` · ${taskComments.length} komentar` : ""}
                        </p>
                        <select
                          className="mt-2 w-full rounded-xl border border-border/50 bg-background/40 px-2 py-1 text-[0.7rem] outline-none"
                          value={task.status}
                          onChange={(e) =>
                            onStatus({ id: task.id, status: e.target.value as TaskStatus })
                          }
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              Pindah ke {s}
                            </option>
                          ))}
                        </select>

                        {openTask === task.id ? (
                          <TaskDetail
                            task={task}
                            members={members}
                            comments={taskComments}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onComment={onComment}
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SectionCard title="Task Baru" description="Tugaskan ke anggota tim dan tentukan prioritas.">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={cn(inputClass, "sm:col-span-2")}
            placeholder="Judul task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows={2}
            className={cn(inputClass, "sm:col-span-2")}
            placeholder="Deskripsi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className={inputClass}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Belum ditugaskan</option>
            {members.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} · {m.role}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="date"
            className={inputClass}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button
            type="button"
            disabled={!title.trim() || busy}
            onClick={() => {
              onCreate({
                title: title.trim(),
                description: description.trim() || null,
                assignee: assignee.trim() || null,
                priority,
                status: "Todo",
                due_date: due || null,
              });
              setTitle("");
              setDescription("");
              setDue("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/90 px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Tambah Task
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function TaskDetail({
  task,
  members,
  comments,
  onUpdate,
  onDelete,
  onComment,
}: {
  task: BoardTask;
  members: BoardMember[];
  comments: BoardComment[];
  onUpdate: (input: BoardTask) => void;
  onDelete: (id: string) => void;
  onComment: (input: { taskId: string; body: string }) => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    assignee: task.assignee ?? "",
    priority: task.priority,
    status: task.status,
    due_date: task.due_date ?? "",
    notes: task.notes ?? "",
  });
  const [comment, setComment] = useState("");

  return (
    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
      <input
        className={inputClass}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        rows={2}
        className={inputClass}
        placeholder="Deskripsi"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <select
        className={inputClass}
        value={form.assignee}
        onChange={(e) => setForm({ ...form, assignee: e.target.value })}
      >
        <option value="">Belum ditugaskan</option>
        {members.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name} · {m.role}
          </option>
        ))}
        {form.assignee && !members.some((m) => m.name === form.assignee) ? (
          <option value={form.assignee}>{form.assignee}</option>
        ) : null}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={inputClass}
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
      </div>
      <textarea
        rows={2}
        className={inputClass}
        placeholder="Catatan internal"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onUpdate({
              id: task.id,
              title: form.title,
              description: form.description || null,
              assignee: form.assignee || null,
              priority: form.priority,
              status: form.status,
              due_date: form.due_date || null,
              notes: form.notes || null,
            })
          }
          className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Simpan Task
        </button>
        <button
          type="button"
          aria-label="Hapus task"
          onClick={() => onDelete(task.id)}
          className="grid h-7 w-7 place-items-center rounded-lg border border-border/50 text-muted-foreground transition hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/30 p-3">
        <p className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Diskusi internal
        </p>
        <ul className="mt-2 space-y-2">
          {comments.length === 0 ? (
            <li className="text-[0.7rem] text-muted-foreground">Belum ada komentar.</li>
          ) : (
            comments.map((item) => (
              <li key={item.id} className="border-l border-border/50 pl-2">
                <p className="whitespace-pre-wrap text-xs text-foreground">{item.body}</p>
                <p className="text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {item.author_name} · {formatDate(item.created_at)}
                </p>
              </li>
            ))
          )}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder="Tulis komentar…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="button"
            disabled={!comment.trim()}
            onClick={() => {
              onComment({ taskId: task.id, body: comment.trim() });
              setComment("");
            }}
            className="shrink-0 rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlassEmpty({ children }: { children: React.ReactNode }) {
  return <GlassCard className="text-xs text-muted-foreground">{children}</GlassCard>;
}
