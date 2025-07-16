import { useState, useEffect, useCallback } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Badge,
  DataTable,
  EmptyState,
  TextField,
  Select,
  Pagination,
  Tooltip,
  Icon,
  Divider,
  Modal,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { SearchIcon, ExportIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Load existing popup configuration for dashboard modal
    let existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    // Check app embed status
    let appEmbedEnabled = false;
    if (existingConfig) {
      appEmbedEnabled = existingConfig.displayDelay === 0 &&
                      existingConfig.frequency === "once" &&
                      existingConfig.exitIntent === false;
    }
    
    return {
      shop: session.shop,
      existingConfig,
      appEmbedEnabled
    };
  } catch (error) {
    return {
      shop: session.shop,
      existingConfig: null,
      appEmbedEnabled: false
    };
  }
};

export default function SubscribersPage() {
  const loaderData = useLoaderData();
  const subscribersFetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const limit = 25;
  
  const existingConfig = loaderData?.existingConfig;

  // Load subscribers data
  const loadSubscribers = useCallback(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      search: searchQuery,
      sortBy,
      sortOrder,
    });
    subscribersFetcher.load(`/api/admin/subscribers?${params}`);
  }, [currentPage, searchQuery, sortBy, sortOrder, limit]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadSubscribers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const subscribers = subscribersFetcher.data?.subscribers || [];
  const pagination = subscribersFetcher.data?.pagination || {};
  const summary = subscribersFetcher.data?.summary || {};
  const isLoading = subscribersFetcher.state === "loading";

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSourceBadge = (source) => {
    return source === "popup" ? (
      <Badge tone="info">Popup</Badge>
    ) : (
      <Badge tone="success">Discount</Badge>
    );
  };

  const getActivityStatus = (lastActivity) => {
    const daysSince = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return <Badge tone="success">Active</Badge>;
    if (daysSince <= 30) return <Badge tone="attention">Recent</Badge>;
    return <Badge tone="subdued">Inactive</Badge>;
  };

  const renderSummaryCards = () => (
    <Layout>
      <Layout.Section oneQuarter>
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              Email Subscribers
            </Text>
            <Text as="p" variant="heading2xl">
              {summary.totalSubscribers?.toLocaleString() || 0}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Users who entered email in popup
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
      <Layout.Section oneQuarter>
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              Active (30 days)
            </Text>
            <Text as="p" variant="heading2xl">
              {summary.activeSubscribers?.toLocaleString() || 0}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Recent popup activity
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
      <Layout.Section oneQuarter>
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              Total Wins
            </Text>
            <Text as="p" variant="heading2xl">
              {summary.totalWins?.toLocaleString() || 0}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Prizes won from wheel spins
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
      <Layout.Section oneQuarter>
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              Total Spins
            </Text>
            <Text as="p" variant="heading2xl">
              {summary.totalSpins?.toLocaleString() || 0}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Wheel spin attempts
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const tableRows = subscribers.map((subscriber) => [
    <Text as="span" variant="bodyMd" fontWeight="medium">
      {subscriber.email}
    </Text>,
    formatDate(subscriber.firstEmailEntry),
    formatDate(subscriber.lastActivity),
    getActivityStatus(subscriber.lastActivity),
    <div style={{ textAlign: 'center' }}>
      <Text as="span" variant="bodyMd">
        {subscriber.popupInteractions?.totalInteractions || 0}
      </Text>
    </div>,
    <div style={{ textAlign: 'center' }}>
      <Text as="span" variant="bodyMd">
        {subscriber.popupInteractions?.wins || 0}
      </Text>
    </div>,
    <div style={{ textAlign: 'center' }}>
      <Text as="span" variant="bodyMd">
        {subscriber.totalDiscounts}
      </Text>
    </div>,
    <Button
      size="slim"
      onClick={() => handleViewDetails(subscriber)}
    >
      View Details
    </Button>,
  ]);

  const tableHeadings = [
    { title: "Email", sortable: true, id: "email" },
    { title: "First Email Entry", sortable: true, id: "firstEmailEntry" },
    { title: "Last Activity", sortable: true, id: "lastActivity" },
    { title: "Status", sortable: false },
    { title: "Total Interactions", sortable: true, id: "totalInteractions" },
    { title: "Wins", sortable: true, id: "wins" },
    { title: "Discounts", sortable: true, id: "totalDiscounts" },
    { title: "Actions", sortable: false },
  ];

  const renderDetailsModal = () => {
    if (!selectedSubscriber) return null;

    return (
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Subscriber Details: ${selectedSubscriber.email}`}
        primaryAction={{
          content: "Close",
          onAction: () => setShowDetailsModal(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Layout>
              <Layout.Section oneHalf>
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Overview</Text>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Email:</Text>
                        <Text as="span" variant="bodyMd" fontWeight="medium">
                          {selectedSubscriber.email}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Source:</Text>
                        {getSourceBadge(selectedSubscriber.source)}
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">First Email Entry:</Text>
                        <Text as="span" variant="bodyMd">
                          {formatDate(selectedSubscriber.firstEmailEntry)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Last Activity:</Text>
                        <Text as="span" variant="bodyMd">
                          {formatDate(selectedSubscriber.lastActivity)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Status:</Text>
                        {getActivityStatus(selectedSubscriber.lastActivity)}
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
              <Layout.Section oneHalf>
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Activity Summary</Text>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Total Discounts:</Text>
                        <Badge tone="success">{selectedSubscriber.totalDiscounts}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Active Discounts:</Text>
                        <Badge tone="info">{selectedSubscriber.activeDiscounts}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Total Interactions:</Text>
                        <Badge tone="attention">{selectedSubscriber.popupInteractions?.totalInteractions || 0}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Email Entries:</Text>
                        <Badge tone="info">{selectedSubscriber.popupInteractions?.emailEntries || 0}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Spins:</Text>
                        <Badge tone="warning">{selectedSubscriber.popupInteractions?.spins || 0}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Wins:</Text>
                        <Badge tone="success">{selectedSubscriber.popupInteractions?.wins || 0}</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Losses:</Text>
                        <Badge tone="critical">{selectedSubscriber.popupInteractions?.losses || 0}</Badge>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>

            {selectedSubscriber.prizesWon && selectedSubscriber.prizesWon.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Prizes Won</Text>
                  <List type="bullet">
                    {selectedSubscriber.prizesWon.map((prize, index) => (
                      <List.Item key={index}>
                        <InlineStack gap="200" align="center">
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {prize.prize}
                          </Text>
                          {prize.code && (
                            <Badge tone="success">
                              Code: {prize.code}
                            </Badge>
                          )}
                          <Text as="span" variant="bodySm" tone="subdued">
                            {formatDate(prize.timestamp)}
                          </Text>
                        </InlineStack>
                      </List.Item>
                    ))}
                  </List>
                </BlockStack>
              </Card>
            )}

            {selectedSubscriber.discountCodes && selectedSubscriber.discountCodes.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Discount Codes</Text>
                  <List type="bullet">
                    {selectedSubscriber.discountCodes.map((discount, index) => (
                      <List.Item key={index}>
                        <InlineStack gap="200" align="center">
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {discount.code}
                          </Text>
                          <Badge tone={discount.isActive ? "success" : "subdued"}>
                            {discount.type} {discount.value}
                          </Badge>
                          <Text as="span" variant="bodySm" tone="subdued">
                            Used: {discount.usageCount} times
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {formatDate(discount.createdAt)}
                          </Text>
                        </InlineStack>
                      </List.Item>
                    ))}
                  </List>
                </BlockStack>
              </Card>
            )}

            {selectedSubscriber.interactionHistory && selectedSubscriber.interactionHistory.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Recent Activity</Text>
                  <List type="bullet">
                    {selectedSubscriber.interactionHistory.slice(0, 10).map((interaction, index) => (
                      <List.Item key={index}>
                        <InlineStack gap="200" align="center">
                          <Badge tone={
                            interaction.type === 'win' ? 'success' :
                            interaction.type === 'email_entered' ? 'info' :
                            interaction.type === 'spin' ? 'warning' :
                            interaction.type === 'lose' ? 'critical' :
                            'subdued'
                          }>
                            {interaction.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {interaction.prizeLabel && (
                            <Text as="span" variant="bodyMd">
                              {interaction.prizeLabel}
                            </Text>
                          )}
                          {interaction.discountCode && (
                            <Text as="span" variant="bodyMd" fontWeight="medium">
                              {interaction.discountCode}
                            </Text>
                          )}
                          <Text as="span" variant="bodySm" tone="subdued">
                            {formatDate(interaction.timestamp)}
                          </Text>
                        </InlineStack>
                      </List.Item>
                    ))}
                  </List>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    );
  };

  const renderDashboardModal = () => {
    return (
      <Modal
        open={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        title="QuickPop Dashboard"
        primaryAction={{
          content: "Close",
          onAction: () => setShowDashboardModal(false),
        }}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Popup Management
            </Text>
            
            <Layout>
              <Layout.Section oneHalf>
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">Create New Popup</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Create a new popup to engage your customers
                    </Text>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowDashboardModal(false);
                        window.open('/app/popup-customizer', '_self');
                      }}
                    >
                      Create Popup
                    </Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
              
              <Layout.Section oneHalf>
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">Edit Existing Popup</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {existingConfig ? "Modify your current popup settings" : "No popup configured yet"}
                    </Text>
                    <Button
                      disabled={!existingConfig}
                      onClick={() => {
                        setShowDashboardModal(false);
                        window.open('/app/popup-customizer', '_self');
                      }}
                    >
                      {existingConfig ? "Edit Popup" : "No Popup Available"}
                    </Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
            
            {existingConfig && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Current Popup Status</Text>
                  <InlineStack gap="200">
                    <Badge tone={existingConfig.isActive ? "success" : "subdued"}>
                      {existingConfig.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Text as="span" variant="bodyMd">
                      Type: {existingConfig.type}
                    </Text>
                    <Text as="span" variant="bodyMd">
                      Title: {existingConfig.title}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    );
  };

  return (
    <Page>
      <TitleBar title="Subscribers">
        <Button
          onClick={() => setShowDashboardModal(true)}
        >
          Dashboard
        </Button>
        <Button
          icon={ExportIcon}
          onClick={() => {
            // TODO: Implement export functionality
            console.log("Export subscribers");
          }}
        >
          Export
        </Button>
      </TitleBar>

      <BlockStack gap="500">
        {renderSummaryCards()}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    All Subscribers
                  </Text>
                  <InlineStack gap="300">
                    <Box width="300px">
                      <TextField
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        prefix={<Icon source={SearchIcon} />}
                        clearButton
                        onClearButtonClick={() => setSearchQuery("")}
                      />
                    </Box>
                    <Select
                      label="Sort by"
                      labelHidden
                      options={[
                        { label: "Last Activity", value: "lastActivity" },
                        { label: "First Email Entry", value: "firstEmailEntry" },
                        { label: "Email", value: "email" },
                        { label: "Total Interactions", value: "totalInteractions" },
                        { label: "Wins", value: "wins" },
                        { label: "Total Discounts", value: "totalDiscounts" },
                      ]}
                      value={sortBy}
                      onChange={setSortBy}
                    />
                  </InlineStack>
                </InlineStack>

                {subscribers.length > 0 ? (
                  <BlockStack gap="400">
                    <DataTable
                      columnContentTypes={[
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                        "numeric",
                        "numeric",
                        "text",
                      ]}
                      headings={tableHeadings.map((heading) => (
                        <Button
                          key={heading.id || heading.title}
                          variant="plain"
                          onClick={() => heading.sortable && handleSort(heading.id)}
                          disabled={!heading.sortable}
                        >
                          <InlineStack gap="100" align="center">
                            <Text as="span" variant="bodyMd" fontWeight="medium">
                              {heading.title}
                            </Text>
                            {heading.sortable && sortBy === heading.id && (
                              <Text as="span" variant="bodySm">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </Text>
                            )}
                          </InlineStack>
                        </Button>
                      ))}
                      rows={tableRows}
                      loading={isLoading}
                    />

                    {pagination.totalPages > 1 && (
                      <Box paddingBlockStart="400">
                        <InlineStack align="center">
                          <Pagination
                            hasPrevious={pagination.hasPrev}
                            onPrevious={() => handlePageChange(currentPage - 1)}
                            hasNext={pagination.hasNext}
                            onNext={() => handlePageChange(currentPage + 1)}
                            label={`Page ${pagination.page} of ${pagination.totalPages}`}
                          />
                        </InlineStack>
                      </Box>
                    )}
                  </BlockStack>
                ) : (
                  <EmptyState
                    heading="No subscribers found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      {searchQuery
                        ? "Try adjusting your search terms."
                        : "Subscribers will appear here when customers interact with your popups."}
                    </p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      {renderDetailsModal()}
      {renderDashboardModal()}
    </Page>
  );
}