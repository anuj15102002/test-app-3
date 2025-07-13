import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  InlineStack,
  Select,
  Badge,
  Divider,
  DataTable,
  EmptyState,
  ProgressBar,
  Tooltip,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function AnalyticsPage() {
  const analyticsFetcher = useFetcher();
  const [timeRange, setTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load analytics data on component mount
  useEffect(() => {
    analyticsFetcher.load(`/api/admin/analytics?timeRange=${timeRange}`);
  }, [timeRange]);

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      analyticsFetcher.load(`/api/admin/analytics?timeRange=${timeRange}`);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange, autoRefresh]);

  const analytics = analyticsFetcher.data?.analytics;

  const renderMetricCard = (title, value, subtitle, tone = "info", progress = null) => (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
        {subtitle && (
          <Text as="p" variant="bodyMd" tone="subdued">
            {subtitle}
          </Text>
        )}
        {progress !== null && (
          <ProgressBar progress={progress} tone={tone} />
        )}
      </BlockStack>
    </Card>
  );

  const renderHourlyChart = () => {
    if (!analytics?.hourlyData) return null;

    const maxViews = Math.max(...analytics.hourlyData.map(h => h.views));
    const maxEmails = Math.max(...analytics.hourlyData.map(h => h.emails));
    const maxWins = Math.max(...analytics.hourlyData.map(h => h.wins));

    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Hourly Performance (Last 24 Hours)
          </Text>
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <BlockStack gap="300">
              {analytics.hourlyData.slice(-12).map((hour, index) => (
                <InlineStack key={hour.hour} align="space-between" gap="400">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {hour.hour}:00
                  </Text>
                  <InlineStack gap="400" align="center">
                    <Box minWidth="100px">
                      <InlineStack gap="200" align="center">
                        <Text as="span" variant="bodySm">Views:</Text>
                        <Badge tone="info">{hour.views}</Badge>
                        <Box width="60px">
                          <ProgressBar 
                            progress={maxViews > 0 ? (hour.views / maxViews) * 100 : 0} 
                            tone="info" 
                            size="small"
                          />
                        </Box>
                      </InlineStack>
                    </Box>
                    <Box minWidth="100px">
                      <InlineStack gap="200" align="center">
                        <Text as="span" variant="bodySm">Emails:</Text>
                        <Badge tone="success">{hour.emails}</Badge>
                        <Box width="60px">
                          <ProgressBar 
                            progress={maxEmails > 0 ? (hour.emails / maxEmails) * 100 : 0} 
                            tone="success" 
                            size="small"
                          />
                        </Box>
                      </InlineStack>
                    </Box>
                    <Box minWidth="100px">
                      <InlineStack gap="200" align="center">
                        <Text as="span" variant="bodySm">Wins:</Text>
                        <Badge tone="attention">{hour.wins}</Badge>
                        <Box width="60px">
                          <ProgressBar 
                            progress={maxWins > 0 ? (hour.wins / maxWins) * 100 : 0} 
                            tone="attention" 
                            size="small"
                          />
                        </Box>
                      </InlineStack>
                    </Box>
                  </InlineStack>
                </InlineStack>
              ))}
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>
    );
  };

  const renderPrizeDistribution = () => {
    if (!analytics?.prizeDistribution || Object.keys(analytics.prizeDistribution).length === 0) {
      return (
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">Prize Distribution</Text>
            <EmptyState
              heading="No prizes won yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Prize distribution will appear here when customers start winning.</p>
            </EmptyState>
          </BlockStack>
        </Card>
      );
    }

    const totalPrizes = Object.values(analytics.prizeDistribution).reduce((sum, count) => sum + count, 0);
    const sortedPrizes = Object.entries(analytics.prizeDistribution)
      .sort(([,a], [,b]) => b - a);

    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">Prize Distribution</Text>
          <BlockStack gap="300">
            {sortedPrizes.map(([prize, count]) => {
              const percentage = totalPrizes > 0 ? ((count / totalPrizes) * 100).toFixed(1) : 0;
              return (
                <Box key={prize} padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {prize}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {count} wins ({percentage}%)
                      </Text>
                    </BlockStack>
                    <Box width="100px">
                      <ProgressBar progress={parseFloat(percentage)} tone="success" />
                    </Box>
                  </InlineStack>
                </Box>
              );
            })}
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };

  const renderActivityFeed = () => {
    if (!analytics?.recentEvents || analytics.recentEvents.length === 0) {
      return (
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">Recent Activity</Text>
            <EmptyState
              heading="No activity yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Recent popup activity will appear here.</p>
            </EmptyState>
          </BlockStack>
        </Card>
      );
    }

    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">Recent Activity</Text>
            <Badge tone="info">Live</Badge>
          </InlineStack>
          <BlockStack gap="200">
            {analytics.recentEvents.slice(0, 15).map((event) => (
              <Box key={event.id} padding="300" background="bg-surface-secondary" borderRadius="200">
                <InlineStack align="space-between">
                  <InlineStack gap="300" align="center">
                    <Badge tone={
                      event.eventType === 'win' ? 'success' :
                      event.eventType === 'view' ? 'info' :
                      event.eventType === 'email_entered' ? 'attention' :
                      event.eventType === 'copy_code' ? 'success' :
                      'subdued'
                    }>
                      {event.eventType === 'view' ? '👁️ View' :
                       event.eventType === 'email_entered' ? '📧 Email' :
                       event.eventType === 'spin' ? '🎡 Spin' :
                       event.eventType === 'win' ? '🎉 Win' :
                       event.eventType === 'lose' ? '😔 Lose' :
                       event.eventType === 'copy_code' ? '📋 Copy' :
                       event.eventType === 'close' ? '❌ Close' :
                       event.eventType}
                    </Badge>
                    <BlockStack gap="050">
                      <InlineStack gap="200">
                        {event.email && (
                          <Text as="span" variant="bodyMd" tone="subdued">
                            {event.email.substring(0, 3)}***@{event.email.split('@')[1]}
                          </Text>
                        )}
                        {event.prizeLabel && (
                          <Text as="span" variant="bodyMd">
                            {event.prizeLabel}
                          </Text>
                        )}
                        {event.discountCode && (
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {event.discountCode}
                          </Text>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </InlineStack>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {event.timeAgo}
                  </Text>
                </InlineStack>
              </Box>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };

  return (
    <Page>
      <TitleBar title="Analytics Dashboard">
        <Button 
          onClick={() => analyticsFetcher.load(`/api/admin/analytics?timeRange=${timeRange}`)}
          loading={analyticsFetcher.state === "loading"}
        >
          Refresh Data
        </Button>
      </TitleBar>
      
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Popup Performance Analytics
                  </Text>
                  <InlineStack gap="300">
                    <Select
                      label="Time Range"
                      labelHidden
                      options={[
                        { label: "Last 24 hours", value: "24h" },
                        { label: "Last 7 days", value: "7d" },
                        { label: "Last 30 days", value: "30d" },
                      ]}
                      value={timeRange}
                      onChange={setTimeRange}
                    />
                    <Button
                      pressed={autoRefresh}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                      {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                    </Button>
                  </InlineStack>
                </InlineStack>
                
                {analytics && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {analytics ? (
          <Layout>
            <Layout.Section>
              <BlockStack gap="500">
                {/* Key Metrics */}
                <Layout>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Total Views", 
                      analytics.summary.totalViews.toLocaleString(),
                      "Popup impressions"
                    )}
                  </Layout.Section>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Email Conversions", 
                      analytics.summary.emailsEntered.toLocaleString(),
                      `${analytics.summary.emailConversionRate}% conversion rate`,
                      analytics.summary.emailConversionRate > 10 ? "success" : "warning",
                      analytics.summary.emailConversionRate
                    )}
                  </Layout.Section>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Winners", 
                      analytics.summary.wins.toLocaleString(),
                      `${analytics.summary.winRate}% win rate`,
                      analytics.summary.winRate > 20 ? "success" : "info",
                      analytics.summary.winRate
                    )}
                  </Layout.Section>
                </Layout>

                <Layout>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Wheel Spins", 
                      analytics.summary.spins.toLocaleString(),
                      `${analytics.summary.spinConversionRate}% of emails spin`
                    )}
                  </Layout.Section>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Codes Copied", 
                      analytics.summary.codesCopied.toLocaleString(),
                      `${analytics.summary.copyRate}% copy rate`,
                      analytics.summary.copyRate > 80 ? "success" : "warning",
                      analytics.summary.copyRate
                    )}
                  </Layout.Section>
                  <Layout.Section oneThird>
                    {renderMetricCard(
                      "Popup Closes", 
                      analytics.summary.closes.toLocaleString(),
                      "Users who closed popup"
                    )}
                  </Layout.Section>
                </Layout>

                {/* Charts and Detailed Analytics */}
                <Layout>
                  <Layout.Section>
                    {renderHourlyChart()}
                  </Layout.Section>
                </Layout>

                <Layout>
                  <Layout.Section oneHalf>
                    {renderPrizeDistribution()}
                  </Layout.Section>
                  <Layout.Section oneHalf>
                    {renderActivityFeed()}
                  </Layout.Section>
                </Layout>
              </BlockStack>
            </Layout.Section>
          </Layout>
        ) : (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">Loading Analytics...</Text>
                  <Text as="p" variant="bodyMd">
                    Please wait while we fetch your popup performance data.
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}