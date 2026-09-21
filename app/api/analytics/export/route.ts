import { NextRequest, NextResponse } from "next/server";
import { computeDailyMetrics, DEFAULT_USER_ID } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const format = body.format || "pdf";
    const userId = DEFAULT_USER_ID;

    const data = await computeDailyMetrics(userId);
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === "pdf") {
      const html = generateBriefingHtml(data, dateStr);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="intelligence-briefing-${dateStr}.html"`,
        },
      });
    }

    const avgDepth = data.knowledgeDepth.length
      ? data.knowledgeDepth.reduce((sum: number, d: any) => sum + d.depth, 0) / data.knowledgeDepth.length
      : 0;

    if (format === "notion") {
      const notionApiKey = process.env.NOTION_API_KEY;
      const notionDbId = process.env.NOTION_DATABASE_ID;

      if (!notionApiKey || !notionDbId) {
        return NextResponse.json({
          success: false,
          error:
            "Notion API credentials not configured (NOTION_API_KEY / NOTION_DATABASE_ID). You can export as HTML/PDF or JSON.",
          fallbackData: data,
        });
      }

      // Push page to Notion Database
      const notionResponse = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: notionDbId },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: `Atlas Intelligence Briefing — ${dateStr}`,
                  },
                },
              ],
            },
          },
          children: [
            {
              object: "block",
              type: "heading_1",
              heading_1: {
                rich_text: [
                  {
                    type: "text",
                    text: { content: "Personal Intelligence Snapshot" },
                  },
                ],
              },
            },
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: `Generated on ${dateStr}. Daily reading velocity: ${data.velocity.today} articles (7-day avg: ${data.velocity.weeklyAvg.toFixed(1)}/day). Overall knowledge depth score: ${(avgDepth * 100).toFixed(0)}%.`,
                    },
                  },
                ],
              },
            },
            {
              object: "block",
              type: "heading_2",
              heading_2: {
                rich_text: [
                  {
                    type: "text",
                    text: { content: "Emergent Keyword Radar" },
                  },
                ],
              },
            },
            ...data.emergentKeywords.slice(0, 5).map((kw) => ({
              object: "block",
              type: "bulleted_list_item",
              bulleted_list_item: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: `${kw.keyword} (${kw.delta >= 0 ? "+" : ""}${kw.delta}% momentum, ${kw.currentCount} occurrences${kw.topic ? `, topic: ${kw.topic}` : ""})`,
                    },
                  },
                ],
              },
            })),
            {
              object: "block",
              type: "heading_2",
              heading_2: {
                rich_text: [
                  {
                    type: "text",
                    text: { content: "Knowledge Depth & Gaps" },
                  },
                ],
              },
            },
            ...data.knowledgeDepth.map((kd) => ({
              object: "block",
              type: "bulleted_list_item",
              bulleted_list_item: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: `${kd.topic}: ${(kd.depth * 100).toFixed(0)}% depth ${kd.gap ? "⚠️ (Knowledge Gap: High interest, low retention)" : "✓"}`,
                    },
                  },
                ],
              },
            })),
          ],
        }),
      });

      if (!notionResponse.ok) {
        const errJson = await notionResponse.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          error:
            errJson.message ||
            `Notion API error with status ${notionResponse.status}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Successfully synchronized briefing with Notion!",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported export format: ${format}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate export",
      },
      { status: 500 }
    );
  }
}

function generateBriefingHtml(data: any, dateStr: string): string {
  const avgDepth = data.knowledgeDepth?.length
    ? data.knowledgeDepth.reduce((sum: number, d: any) => sum + d.depth, 0) / data.knowledgeDepth.length
    : 0;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Atlas Intelligence Briefing — ${dateStr}</title>
  <style>
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1c1917;
      background: #faf8f5;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    h1, h2, h3 {
      font-family: Georgia, serif;
      color: #1c1917;
      margin-top: 0;
    }
    .header {
      border-bottom: 2px solid #e7e5e4;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 9999px;
      background: #fef3c7;
      color: #92400e;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: #f5f5f4;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .card-val {
      font-size: 24px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 4px;
    }
    .card-lbl {
      font-size: 11px;
      text-transform: uppercase;
      color: #78716c;
      letter-spacing: 0.05em;
    }
    .section {
      margin-bottom: 32px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e7e5e4;
    }
    th {
      font-weight: 600;
      color: #78716c;
      background: #f5f5f4;
    }
    .gap-pill {
      display: inline-block;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
      background: #fee2e2;
      color: #991b1b;
    }
    .ok-pill {
      display: inline-block;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
      background: #dcfce7;
      color: #166534;
    }
    .footer {
      border-top: 1px solid #e7e5e4;
      padding-top: 24px;
      margin-top: 40px;
      font-size: 12px;
      color: #a8a29e;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">Intelligence Briefing</span>
        <h1 style="margin-top: 8px; font-size: 28px;">Atlas Intelligence Digest</h1>
        <p style="margin: 4px 0 0 0; color: #78716c; font-size: 14px;">Date: ${dateStr} • Prepared for Personal Intelligence System</p>
      </div>
      <div class="no-print" style="text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #1c1917; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-val">${data.velocity.today}</div>
        <div class="card-lbl">Articles Read Today</div>
      </div>
      <div class="card">
        <div class="card-val">${data.velocity.weeklyAvg.toFixed(1)}</div>
        <div class="card-lbl">7-Day Daily Avg</div>
      </div>
      <div class="card">
        <div class="card-val">${Math.round(avgDepth * 100)}%</div>
        <div class="card-lbl">Knowledge Depth</div>
      </div>
      <div class="card">
        <div class="card-val">${data.engagementBreakdown.save}</div>
        <div class="card-lbl">Total Articles Saved</div>
      </div>
    </div>

    <div class="section">
      <h2 style="font-size: 18px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px;">Emergent Keyword Radar</h2>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Momentum</th>
            <th>Frequency</th>
            <th>Topic Domain</th>
          </tr>
        </thead>
        <tbody>
          ${data.emergentKeywords
            .slice(0, 8)
            .map(
              (kw: any) => `
            <tr>
              <td><strong>${kw.keyword}</strong></td>
              <td><span style="color: ${kw.delta >= 0 ? "#16a34a" : "#dc2626"}; font-weight: 600;">${kw.delta >= 0 ? "+" : ""}${kw.delta}%</span></td>
              <td>${kw.currentCount}</td>
              <td>${kw.topic || "General"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2 style="font-size: 18px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px;">Knowledge Depth & Gap Detection</h2>
      <table>
        <thead>
          <tr>
            <th>Interest Domain</th>
            <th>Depth Score</th>
            <th>Tracked Weight</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.knowledgeDepth
            .map(
              (kd: any) => `
            <tr>
              <td><strong>${kd.topic}</strong></td>
              <td>${Math.round(kd.depth * 100)}%</td>
              <td>${kd.weight.toFixed(2)}</td>
              <td>${kd.gap ? '<span class="gap-pill">⚠️ Knowledge Gap</span>' : '<span class="ok-pill">✓ Balanced</span>'}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated automatically by Atlas Autonomous AI News Agent. Keep learning, stay curious.
    </div>
  </div>
</body>
</html>`;
}
