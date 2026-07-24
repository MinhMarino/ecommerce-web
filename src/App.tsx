import { FormEvent, useEffect, useState } from "react";
import "./App.css";

type Health = {
  ok: boolean;
  service: string;
  database: "connected" | "disconnected";
  timestamp: string;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  status: string;
};

type Student = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    price: "",
  });
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, coursesRes, studentsRes] = await Promise.all([
        fetchJson<Health>("/api/health"),
        fetchJson<Course[]>("/api/courses"),
        fetchJson<Student[]>("/api/students"),
      ]);
      setHealth(healthRes);
      setCourses(coursesRes);
      setStudents(studentsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onCreateCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await fetchJson<Course>("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: courseForm.title,
          slug: courseForm.slug,
          price: Number(courseForm.price || 0),
          status: "PUBLISHED",
        }),
      });
      setCourseForm({ title: "", slug: "", price: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo khóa học thất bại");
    }
  }

  async function onCreateStudent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await fetchJson<Student>("/api/students", {
        method: "POST",
        body: JSON.stringify({
          fullName: studentForm.fullName,
          email: studentForm.email,
          phone: studentForm.phone || null,
        }),
      });
      setStudentForm({ fullName: "", email: "", phone: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo học sinh thất bại");
    }
  }

  return (
    <div className="page">
      <header className="header">
        <p className="brand">Mono Ecommerce</p>
        <h1>Quản lý khóa học & học sinh</h1>
        <p className="sub">
          React FE · Next.js API · TiDB Cloud
          {health ? (
            <>
              {" "}
              · DB:{" "}
              <span className={health.database === "connected" ? "ok" : "bad"}>
                {health.database}
              </span>
            </>
          ) : null}
        </p>
      </header>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? <div className="banner">Đang tải...</div> : null}

      <section className="grid">
        <div>
          <h2>Khóa học</h2>
          <form className="form" onSubmit={onCreateCourse}>
            <input
              placeholder="Tên khóa học"
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, title: e.target.value }))
              }
              required
            />
            <input
              placeholder="slug-khoa-hoc"
              value={courseForm.slug}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, slug: e.target.value }))
              }
              required
            />
            <input
              type="number"
              placeholder="Giá"
              value={courseForm.price}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, price: e.target.value }))
              }
              required
            />
            <button type="submit">Thêm khóa học</button>
          </form>
          <ul className="list">
            {courses.map((course) => (
              <li key={course.id}>
                <strong>{course.title}</strong>
                <span>
                  {course.price.toLocaleString("vi-VN")} {course.currency} ·{" "}
                  {course.status}
                </span>
              </li>
            ))}
            {!courses.length && !loading ? <li>Chưa có khóa học</li> : null}
          </ul>
        </div>

        <div>
          <h2>Học sinh</h2>
          <form className="form" onSubmit={onCreateStudent}>
            <input
              placeholder="Họ và tên"
              value={studentForm.fullName}
              onChange={(e) =>
                setStudentForm((s) => ({ ...s, fullName: e.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={studentForm.email}
              onChange={(e) =>
                setStudentForm((s) => ({ ...s, email: e.target.value }))
              }
              required
            />
            <input
              placeholder="Số điện thoại"
              value={studentForm.phone}
              onChange={(e) =>
                setStudentForm((s) => ({ ...s, phone: e.target.value }))
              }
            />
            <button type="submit">Thêm học sinh</button>
          </form>
          <ul className="list">
            {students.map((student) => (
              <li key={student.id}>
                <strong>{student.fullName}</strong>
                <span>
                  {student.email}
                  {student.phone ? ` · ${student.phone}` : ""}
                </span>
              </li>
            ))}
            {!students.length && !loading ? <li>Chưa có học sinh</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
