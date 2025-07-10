import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  ProgressBar,
  DataTable,
  Button,
  Select,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState } from "react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7days");
  
  const timeRangeOptions = [
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "Last 90 days", value: "90days" },
  ];

  // Mock analytics data
  const analyticsData = {
    totalViews: 12345,
    totalConversions: 1567,
    conversionRate: 12.7,
    emailSignups: 1234,
    wheelSpins: 333,
    topPerformingPopup: "Email Discount",
    averageTimeToConvert: "2.3 minutes",
  };

  const performanceData = [
    ["Email Popup", "8,234", "1,045", "12.7%", "Active"],
    ["Spinning Wheel", "4,111", "522", "12.7%", "Active"],
    ["Exit Intent Email", "2,567", "289", "11.3%", "Paused"],
    ["Mobile Wheel", "1,890", "234", "12.4%", "Active"],
  ];

  const conversionTrends = [
    { day: "Mon", conversions: 45 },
    { day: "Tue", conversions: 52 },
    { day: "Wed", conversions: 38 },
    { day: "Thu", conversions: 61 },
    { day: "Fri", conversions: 73 },
    { day: "Sat", conversions: 89 },
    { day: "Sun", conversions: 67 },
  ];

  return (
    <Page>
      <TitleBar title="Popup Analytics" />
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h2" variant="headingMd">
                Performance Overview
              </Text>
              <Select
                label=""
                options={timeRangeOptions}
                value={timeRange}
                onChange={setTimeRange}
              />
            </InlineStack>
            
            <Layout>
              <Layout.Section>
                <InlineStack gap="400">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        Total Views
                      </Text>
                      <Text as="p" variant="headingLg">
                        {analyticsData.totalViews.toLocaleString()}
                      </Text>
                      <Badge tone="success">+15.3% vs last period</Badge>
                    </BlockStack>
                  </Card>
                  
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        Conversions
                      </Text>
                      <Text as="p" variant="headingLg">
                        {analyticsData.totalConversions.toLocaleString()}
                      </Text>
                      <Badge tone="success">+8.7% vs last period</Badge>
                    </BlockStack>
                  </Card>
                  
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        Conversion Rate
                      </Text>
                      <Text as="p" variant="headingLg">
                        {analyticsData.conversionRate}%
                      </Text>
                      <Badge tone="info">-2.1% vs last period</Badge>
                    </BlockStack>
                  </Card>
                  
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        Avg. Time to Convert
                      </Text>
                      <Text as="p" variant="headingLg">
                        {analyticsData.averageTimeToConvert}
                      </Text>
                      <Badge tone="success">-12s vs last period</Badge>
                    </BlockStack>
                  </Card>
                </InlineStack>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Popup Performance
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric", "text"]}
                  headings={["Popup Type", "Views", "Conversions", "Rate", "Status"]}
                  rows={performanceData}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Conversion Breakdown
                  </Text>
                  
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Email Signups</Text>
                        <Text as="span" variant="bodyMd">{analyticsData.emailSignups}</Text>
                      </InlineStack>
                      <ProgressBar progress={78} size="small" />
                    </BlockStack>
                    
                    <BlockStack gap="100">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Wheel Spins</Text>
                        <Text as="span" variant="bodyMd">{analyticsData.wheelSpins}</Text>
                      </InlineStack>
                      <ProgressBar progress={22} size="small" />
                    </BlockStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Weekly Trend
                  </Text>
                  
                  <BlockStack gap="200">
                    {conversionTrends.map((trend, index) => (
                      <InlineStack key={index} align="space-between">
                        <Text as="span" variant="bodyMd">{trend.day}</Text>
                        <InlineStack gap="200" align="center">
                          <Box minWidth="60px">
                            <ProgressBar
                              progress={(trend.conversions / 100) * 100}
                              size="small"
                            />
                          </Box>
                          <Text as="span" variant="bodyMd">{trend.conversions}</Text>
                        </InlineStack>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Quick Actions
                  </Text>
                  
                  <BlockStack gap="200">
                    <Button fullWidth>Export Analytics Report</Button>
                    <Button fullWidth variant="plain">View Detailed Reports</Button>
                    <Button fullWidth variant="plain">A/B Test Results</Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              Insights & Recommendations
            </Text>
            
            <BlockStack gap="300">
              <Box padding="300" background="bg-surface-success-subdued" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">
                    🎯 Top Performing Popup
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Your <strong>{analyticsData.topPerformingPopup}</strong> is converting at {analyticsData.conversionRate}%.
                    Consider creating similar variations to maximize conversions.
                  </Text>
                </BlockStack>
              </Box>
              
              <Box padding="300" background="bg-surface-info-subdued" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">
                    📊 Optimization Opportunity
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Friday and Saturday show the highest conversion rates. Consider increasing popup frequency during weekends.
                  </Text>
                </BlockStack>
              </Box>
              
              <Box padding="300" background="bg-surface-warning-subdued" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">
                    ⚠️ Action Required
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Your "Exit Intent Email" popup is underperforming. Consider updating the offer or testing new copy.
                  </Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
