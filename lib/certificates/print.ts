import { CertificateTemplate } from "@/lib/types";

interface CertificatePrintInput {
  courseTitle: string;
  userName: string;
  certificateNumber: string;
  issuedAt: string;
  score: number;
  attempts: number;
  totalQuestions: number;
  passingScore: number;
  template?: CertificateTemplate;
}

export function openCertificatePrint(input: CertificatePrintInput) {
  const popup = window.open("", "_blank", "width=1100,height=760");
  if (!popup) {
    return;
  }

  const dateLabel = new Date(input.issuedAt).toLocaleDateString();
  const bg = input.template?.backgroundImage
    ? `background-image:url('${input.template.backgroundImage}'); background-size:cover;`
    : "";
  const signature = input.template?.signatureImage
    ? `<img src="${input.template.signatureImage}" alt="signature" style="height:64px; object-fit:contain;"/>`
    : "";

  popup.document.write(`
    <html>
      <head>
        <title>Certificate - ${input.courseTitle}</title>
      </head>
      <body style="margin:0; font-family:Arial, sans-serif; background:#f2f2f2; padding:24px;">
        <div style="max-width:980px; margin:0 auto; border:8px solid #ff6b00; background:#fff; border-radius:16px; padding:34px; ${bg}">
          <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#ff6b00;">Engineer With Me</div>
          <h1 style="margin:8px 0 6px; font-size:46px;">Certificate of Completion</h1>
          <p style="margin:0; font-size:18px; color:#333;">This is awarded to</p>
          <h2 style="margin:8px 0; font-size:38px;">${input.userName}</h2>
          <p style="font-size:18px; color:#333; margin-top:10px;">for successfully completing <strong>${input.courseTitle}</strong></p>
          <p style="font-size:15px; color:#555; margin-top:18px;">Certificate Number: ${input.certificateNumber}</p>
          <p style="font-size:15px; color:#555; margin-top:6px;">Issued on: ${dateLabel}</p>
          <p style="font-size:15px; color:#555; margin-top:6px;">Score: ${input.score}% (Pass mark: ${input.passingScore}%)</p>
          <p style="font-size:15px; color:#555; margin-top:6px;">Attempts: ${input.attempts} | Questions: ${input.totalQuestions}</p>
          <div style="display:flex; justify-content:space-between; align-items:end; margin-top:36px;">
            <div>
              <div style="border-top:1px solid #333; width:220px; margin-top:26px;"></div>
              <div style="font-size:13px; color:#555; margin-top:6px;">Authorized Signature</div>
            </div>
            ${signature}
          </div>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
}
