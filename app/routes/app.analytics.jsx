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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

    // Prepare data for the chart
    const chartData = analytics.hourlyData.map((hour) => ({
      time: `${hour.hour}:00`,
      hour: hour.hour,
      Views: hour.views,
      Emails: hour.emails,
      Wins: hour.wins,
    }));

    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Performance Trends ({timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
          </Text>
          <Box padding="400">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e5e9" />
                <XAxis
                  dataKey="time"
                  stroke="#6c7b7f"
                  fontSize={12}
                />
                <YAxis stroke="#6c7b7f" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Views"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Emails"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Wins"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </BlockStack>
      </Card>
    );
  };

  const renderConversionFunnelChart = () => {
    if (!analytics?.summary) return null;

    const funnelData = [
      { name: 'Views', value: analytics.summary.totalViews, color: '#2563eb' },
      { name: 'Emails', value: analytics.summary.emailsEntered, color: '#16a34a' },
      { name: 'Spins', value: analytics.summary.spins, color: '#f59e0b' },
      { name: 'Wins', value: analytics.summary.wins, color: '#dc2626' },
    ];

    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Conversion Funnel
          </Text>
          <Box padding="400">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e5e9" />
                <XAxis
                  dataKey="name"
                  stroke="#6c7b7f"
                  fontSize={12}
                />
                <YAxis stroke="#6c7b7f" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

    // Prepare data for pie chart
    const pieData = sortedPrizes.map(([prize, count], index) => ({
      name: prize,
      value: count,
      percentage: totalPrizes > 0 ? ((count / totalPrizes) * 100).toFixed(1) : 0,
    }));

    const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">Prize Distribution</Text>
          <Layout>
            <Layout.Section oneHalf>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Layout.Section>
            <Layout.Section oneHalf>
              <BlockStack gap="300">
                {sortedPrizes.map(([prize, count], index) => {
                  const percentage = totalPrizes > 0 ? ((count / totalPrizes) * 100).toFixed(1) : 0;
                  return (
                    <Box key={prize} padding="300" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack align="space-between">
                        <InlineStack gap="200" align="center">
                          <Box
                            width="12px"
                            height="12px"
                            background={COLORS[index % COLORS.length]}
                            borderRadius="50%"
                          />
                          <BlockStack gap="100">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {prize}
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {count} wins ({percentage}%)
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <Box width="100px">
                          <ProgressBar progress={parseFloat(percentage)} tone="success" />
                        </Box>
                      </InlineStack>
                    </Box>
                  );
                })}
              </BlockStack>
            </Layout.Section>
          </Layout>
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
                    {renderConversionFunnelChart()}
                  </Layout.Section>
                  <Layout.Section oneHalf>
                    {renderActivityFeed()}
                  </Layout.Section>
                </Layout>

                <Layout>
                  <Layout.Section>
                    {renderPrizeDistribution()}
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