# Admin Dashboard Documentation

## Overview
The Admin Dashboard provides comprehensive subscription metrics and business insights for SEA Catering management to monitor performance and make data-driven decisions.

## 🚀 Features Implemented

### 📅 Date Range Selector
- **Location**: Top of dashboard
- **Functionality**: Filter all metrics within a chosen date range
- **Default**: Last 30 days
- **Usage**: Select start and end dates, click "Apply Filter"

### 📊 Key Metrics Cards

#### 1. **New Subscriptions**
- **Description**: Total number of new subscriptions during selected period
- **Icon**: 🆕
- **Additional Info**: Shows growth percentage vs previous period
- **Calculation**: Count of subscriptions created within date range

#### 2. **Monthly Recurring Revenue (MRR)**
- **Description**: Total revenue from all active subscriptions
- **Icon**: 💰
- **Format**: Indonesian Rupiah (IDR)
- **Calculation**: Sum of total_price for all active subscriptions

#### 3. **Reactivations**
- **Description**: Number of cancelled subscriptions that were restarted
- **Icon**: 🔄
- **Period**: Within selected date range
- **Source**: reactivate_subscriptions table

#### 4. **Active Subscriptions**
- **Description**: Current count of active subscriptions
- **Icon**: 📈
- **Additional Info**: Shows ratio to total subscriptions
- **Calculation**: Count of subscriptions with status = 'active'

### 📈 Additional Analytics

#### **Subscription Status Breakdown**
- **Visual**: Status cards with color coding
- **Data**: Count by status (active, paused, cancelled)
- **Colors**: Green (active), Yellow (paused), Red (cancelled)

#### **Popular Meal Plans**
- **Display**: Top 5 meal plans by subscriber count
- **Metrics**: Subscriber count and total revenue per plan
- **Sorting**: Ordered by number of subscribers (descending)

#### **Recent Subscriptions**
- **Table**: Latest 10 subscriptions in selected date range
- **Columns**: ID, Customer Name, Meal Plan, Price, Status
- **Sorting**: Most recent first

### 🧮 Calculated Insights

#### **Key Insight Card**
- **Metric**: Average revenue per active subscription
- **Calculation**: MRR ÷ Active Subscriptions Count
- **Purpose**: Revenue efficiency indicator

#### **Growth Rate Card**
- **Metric**: Period-over-period growth percentage
- **Calculation**: ((Current Period - Previous Period) ÷ Previous Period) × 100
- **Visual**: Arrow indicators (↗️ growth, ↘️ decline)

#### **Conversion Rate Card**
- **Metric**: Percentage of total subscriptions that are active
- **Calculation**: (Active Subscriptions ÷ Total Subscriptions) × 100
- **Purpose**: Customer retention indicator

## 🛡️ Security Features

### **Admin Role Protection**
- **Access Control**: Only users with UserRole.Admin can access
- **Authentication**: Requires valid session
- **Authorization**: Role-based access control

### **API Security**
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Date range validation
- **Error Handling**: Graceful error responses

## 🔧 Technical Implementation

### **API Endpoint**
- **Route**: `/api/admin/dashboard`
- **Method**: GET
- **Parameters**: `startDate`, `endDate` (optional)
- **Response**: JSON with metrics and analytics data

### **Database Queries**
- **Performance**: Optimized SQL queries with proper joins
- **Aggregations**: Uses COUNT, SUM functions
- **Date Filtering**: Efficient date range queries

### **Frontend Components**
- **Responsive**: Mobile-friendly grid layout
- **Interactive**: Date range selector with real-time updates
- **Visual**: Color-coded status indicators and trend arrows

## 📱 Responsive Design

### **Desktop** (lg+)
- **Metrics**: 4-column grid
- **Charts**: 2-column grid
- **Table**: Full-width scrollable

### **Tablet** (md)
- **Metrics**: 2-column grid
- **Charts**: 2-column grid
- **Table**: Horizontal scroll

### **Mobile** (sm)
- **Metrics**: Single column
- **Charts**: Single column
- **Table**: Horizontal scroll

## 🎯 Business Value

### **For Management**
- **Revenue Tracking**: Real-time MRR monitoring
- **Growth Analysis**: Period-over-period comparisons
- **Customer Insights**: Subscription patterns and preferences

### **For Operations**
- **Performance Metrics**: Clear KPI tracking
- **Trend Analysis**: Growth and decline patterns
- **Data-Driven Decisions**: Comprehensive business insights

## 🚀 Future Enhancements

### **Planned Features**
- **Charts**: Visual graphs for trend analysis
- **Export**: CSV/PDF report generation
- **Alerts**: Automated threshold notifications
- **Forecasting**: Predictive analytics
- **Customer Segments**: Detailed customer analysis

### **Advanced Metrics**
- **Churn Rate**: Customer retention analysis
- **Customer Lifetime Value**: Revenue projections
- **Cohort Analysis**: User behavior patterns
- **Geographic Distribution**: Location-based insights

## 🔗 Navigation

### **Access Methods**
1. **Direct URL**: `/admin/dashboard`
2. **Admin Navbar**: "Admin Dashboard" link
3. **Admin Panel**: "📊 View Dashboard" button

### **User Flow**
1. Admin logs in with valid credentials
2. Navigates to dashboard via navbar or direct link
3. Views default metrics (last 30 days)
4. Adjusts date range as needed
5. Analyzes metrics and insights
6. Makes business decisions based on data

## 📋 Usage Instructions

### **Getting Started**
1. **Login**: Use admin account credentials
2. **Navigate**: Click "Admin Dashboard" in navbar
3. **Review**: Check default metrics for last 30 days
4. **Filter**: Adjust date range if needed
5. **Analyze**: Review all metric cards and charts

### **Date Range Filtering**
1. **Select Start Date**: Choose beginning of period
2. **Select End Date**: Choose end of period
3. **Apply Filter**: Click "Apply Filter" button
4. **Review Results**: Updated metrics display automatically

### **Understanding Metrics**
- **Green Indicators**: Positive trends, healthy metrics
- **Red Indicators**: Negative trends, areas needing attention
- **Yellow Indicators**: Neutral or paused states
- **Trend Arrows**: Quick visual growth/decline indicators

This dashboard provides administrators with everything needed to monitor SEA Catering's subscription business performance effectively.
