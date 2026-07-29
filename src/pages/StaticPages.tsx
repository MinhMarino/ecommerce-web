import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { useSiteSettingsLoader } from "../lib/settings";
import { cn } from "../lib/utils";
import { Container } from "../components/ui/Container";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";

type PageContent = {
  title: string;
  intro?: string;
  sections: { heading: string; body: string[] }[];
};

const PAGES: Record<string, PageContent> = {
  about: {
    title: "Giới thiệu về chúng tôi",
    intro:
      "Mono Commerce là nền tảng mua sắm trực tuyến hiện đại, kết nối khách hàng với hàng ngàn sản phẩm chất lượng từ các thương hiệu uy tín.",
    sections: [
      {
        heading: "Sứ mệnh",
        body: [
          "Chúng tôi hướng đến việc mang lại trải nghiệm mua sắm trực tuyến đơn giản, nhanh chóng và đáng tin cậy cho mọi khách hàng.",
          "Mọi sản phẩm trên nền tảng đều được kiểm duyệt kỹ càng về chất lượng và nguồn gốc trước khi lên kệ.",
        ],
      },
      {
        heading: "Cam kết của chúng tôi",
        body: [
          "Giao hàng đúng hẹn, hỗ trợ thanh toán khi nhận hàng (COD) trên toàn quốc.",
          "Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ 7 ngày mỗi tuần.",
        ],
      },
    ],
  },
  faq: {
    title: "Câu hỏi thường gặp",
    sections: [
      {
        heading: "Làm sao để đặt hàng?",
        body: [
          "Bạn chọn sản phẩm, thêm vào giỏ hàng, sau đó tiến hành thanh toán. Bạn có thể đặt hàng dù đã đăng nhập hoặc chưa.",
        ],
      },
      {
        heading: "Tôi có thể thanh toán bằng hình thức nào?",
        body: ["Hiện tại nền tảng chỉ hỗ trợ thanh toán khi nhận hàng (COD)."],
      },
      {
        heading: "Làm sao để theo dõi đơn hàng?",
        body: [
          "Đăng nhập vào tài khoản, vào mục Tài khoản > Đơn hàng để xem trạng thái và lịch sử đơn hàng của bạn.",
        ],
      },
      {
        heading: "Tôi có thể hủy đơn hàng không?",
        body: [
          "Bạn có thể hủy đơn hàng khi đơn còn ở trạng thái Chờ xác nhận hoặc Đã xác nhận, từ trang chi tiết đơn hàng.",
        ],
      },
    ],
  },
  terms: {
    title: "Điều khoản dịch vụ",
    intro: "Khi sử dụng website, bạn đồng ý với các điều khoản dịch vụ sau đây.",
    sections: [
      {
        heading: "1. Tài khoản người dùng",
        body: [
          "Bạn có trách nhiệm bảo mật thông tin đăng nhập và chịu trách nhiệm với mọi hoạt động diễn ra trên tài khoản của mình.",
        ],
      },
      {
        heading: "2. Đơn hàng và thanh toán",
        body: [
          "Đơn hàng được xác nhận sau khi hệ thống kiểm tra tồn kho và thông tin giao hàng hợp lệ.",
          "Phương thức thanh toán hiện tại là thanh toán khi nhận hàng (COD).",
        ],
      },
      {
        heading: "3. Thay đổi điều khoản",
        body: ["Chúng tôi có thể cập nhật điều khoản dịch vụ theo thời gian và sẽ thông báo trên website."],
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    intro: "Chúng tôi coi trọng việc bảo vệ thông tin cá nhân của khách hàng.",
    sections: [
      {
        heading: "Thông tin thu thập",
        body: ["Họ tên, số điện thoại, địa chỉ giao hàng và email được thu thập để xử lý đơn hàng."],
      },
      {
        heading: "Mục đích sử dụng",
        body: [
          "Thông tin chỉ được sử dụng để xử lý đơn hàng, liên hệ hỗ trợ và gửi thông báo liên quan đến tài khoản.",
        ],
      },
      {
        heading: "Bảo mật thông tin",
        body: ["Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để bảo vệ dữ liệu khách hàng khỏi truy cập trái phép."],
      },
    ],
  },
  "shipping-policy": {
    title: "Chính sách vận chuyển",
    sections: [
      {
        heading: "Phạm vi giao hàng",
        body: ["Giao hàng toàn quốc với các phương thức vận chuyển tiêu chuẩn và nhanh."],
      },
      {
        heading: "Thời gian giao hàng",
        body: ["Thời gian giao hàng dự kiến hiển thị tại bước thanh toán, tùy theo phương thức vận chuyển đã chọn."],
      },
      {
        heading: "Phí vận chuyển",
        body: ["Phí vận chuyển được tính dựa trên phương thức giao hàng bạn chọn tại trang thanh toán."],
      },
    ],
  },
  "return-policy": {
    title: "Chính sách đổi trả",
    sections: [
      {
        heading: "Điều kiện đổi trả",
        body: [
          "Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng, còn nguyên tem mác và chưa qua sử dụng.",
        ],
      },
      {
        heading: "Quy trình đổi trả",
        body: [
          "Liên hệ bộ phận hỗ trợ khách hàng qua email hoặc hotline để được hướng dẫn quy trình đổi trả chi tiết.",
        ],
      },
      {
        heading: "Hoàn tiền",
        body: ["Đối với đơn hàng đã thanh toán, tiền sẽ được hoàn lại sau khi sản phẩm đổi trả được kiểm tra và xác nhận."],
      },
    ],
  },
};

function Accordion({ sections }: { sections: PageContent["sections"] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <Card key={s.heading} className="overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium"
            aria-expanded={open === i}
          >
            {s.heading}
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open === i && "rotate-180")} />
          </button>
          {open === i && (
            <div className="space-y-2 px-5 pb-4 text-sm text-muted">
              {s.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ContactPage() {
  const loadSettings = useSiteSettingsLoader();
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => setSettings({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-xl font-bold sm:text-2xl">Liên hệ</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Có câu hỏi hoặc cần hỗ trợ? Liên hệ với chúng tôi qua các thông tin dưới đây.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {!settings ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-5">
              <MapPin className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Địa chỉ</p>
                <p className="mt-1 text-sm text-muted">{settings.address || "Đang cập nhật"}</p>
              </div>
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <Phone className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Hotline</p>
                <p className="mt-1 text-sm text-muted">{settings.support_phone || "Đang cập nhật"}</p>
              </div>
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <Mail className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Email hỗ trợ</p>
                <p className="mt-1 text-sm text-muted">{settings.support_email || "Đang cập nhật"}</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
}

export function StaticPage() {
  const { slug } = useParams();

  if (slug === "contact") return <ContactPage />;

  const page = slug ? PAGES[slug] : undefined;
  if (!page) return <Navigate to="/" replace />;

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <h1 className="text-xl font-bold sm:text-2xl">{page.title}</h1>
      {page.intro && <p className="mt-3 text-sm leading-relaxed text-muted">{page.intro}</p>}
      <div className="mt-8">
        <Accordion sections={page.sections} />
      </div>
    </Container>
  );
}
