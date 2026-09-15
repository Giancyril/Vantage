import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Hr,
  Preview,
} from "@react-email/components";
import type { AssembledDigest } from "@/lib/digest";

interface DigestEmailProps {
  digest: AssembledDigest;
  userName?: string;
  appUrl?: string;
}

export const DigestEmail: React.FC<DigestEmailProps> = ({
  digest,
  userName = "Executive Reader",
  appUrl = "http://localhost:3000",
}) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Daily AI Intelligence Briefing - {digest.date}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={kickerStyle}>THE DAILY DISTILL</Text>
            <Heading as="h1" style={titleStyle}>
              Intelligence Briefing
            </Heading>
            <Text style={subtitleStyle}>
              Curated for {userName} &bull; {digest.date} &bull; {digest.totalStories} verified stories
            </Text>
            <Hr style={dividerStyle} />
          </Section>

          {/* Sections */}
          {digest.sections.map((section, sIdx) => (
            <Section key={sIdx} style={sectionBlock}>
              <Text style={sectionHeaderBadge}>{section.topic.toUpperCase()}</Text>

              {section.stories.map((story, aIdx) => (
                <div key={aIdx} style={cardStyle}>
                  <Text style={sourceBadge}>
                    {story.source} &bull; Match {Math.round(story.relevanceScore * 100)}%
                  </Text>
                  <Heading as="h2" style={headlineStyle}>
                    <Link href={story.url} style={headlineLink}>
                      {story.title}
                    </Link>
                  </Heading>
                  <Text style={summaryStyle}>{story.summary}</Text>

                  {/* Why it matters callout */}
                  <div style={whyItMattersBox}>
                    <Text style={whyLabel}>WHY THIS MATTERS TO YOU</Text>
                    <Text style={whyText}>{story.whyItMatters}</Text>
                  </div>
                  <Hr style={cardDivider} />
                </div>
              ))}
            </Section>
          ))}

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Delivered by <Link href={appUrl} style={footerLink}>Distill AI News Agent</Link>.
              Learns from what you read, save, and dismiss.
            </Text>
            <Text style={footerSub}>
              To adjust topic weights or add custom keywords, visit your{" "}
              <Link href={`${appUrl}/interests`} style={footerLink}>
                Interest Profile
              </Link>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DigestEmail;

// --- Editorial Styles ---
const mainStyle: React.CSSProperties = {
  backgroundColor: "#F8F7F4",
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: 0,
  padding: "32px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  border: "1px solid #EAE6DF",
  padding: "40px 32px",
};

const headerSection: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const kickerStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "2.5px",
  fontWeight: 700,
  color: "#8C8275",
  margin: "0 0 8px 0",
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#181715",
  margin: "0 0 8px 0",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#7A7368",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
};

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid #EAE6DF",
  margin: "24px 0 0 0",
};

const sectionBlock: React.CSSProperties = {
  marginTop: "28px",
};

const sectionHeaderBadge: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1.2px",
  color: "#9A5B32",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  borderBottom: "1px solid #F0ECE4",
  paddingBottom: "6px",
  marginBottom: "16px",
};

const cardStyle: React.CSSProperties = {
  marginBottom: "24px",
};

const sourceBadge: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#7A7368",
  textTransform: "uppercase",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0 0 4px 0",
};

const headlineStyle: React.CSSProperties = {
  fontSize: "18px",
  lineHeight: "1.4",
  fontWeight: 700,
  margin: "0 0 8px 0",
};

const headlineLink: React.CSSProperties = {
  color: "#181715",
  textDecoration: "none",
};

const summaryStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#383531",
  margin: "0 0 12px 0",
};

const whyItMattersBox: React.CSSProperties = {
  backgroundColor: "#FDFBF7",
  borderLeft: "3px solid #D4A373",
  padding: "10px 14px",
  borderRadius: "0 4px 4px 0",
};

const whyLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1px",
  color: "#B46522",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0 0 4px 0",
};

const whyText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#2C2A27",
  margin: 0,
};

const cardDivider: React.CSSProperties = {
  borderTop: "1px dashed #EDE8E1",
  margin: "20px 0 0 0",
};

const footerSection: React.CSSProperties = {
  borderTop: "1px solid #EAE6DF",
  paddingTop: "24px",
  marginTop: "36px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#7A7368",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0 0 6px 0",
};

const footerSub: React.CSSProperties = {
  fontSize: "11px",
  color: "#A29B8F",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: "#9A5B32",
  textDecoration: "underline",
};
