# KIN Communications Platform
## Master Requirements Document
### Version 2.0 - Phase 2 Implementation

---

## 🎯 Mission Statement

Deliver a seamless contact experience with 100% reliable connectivity, smart and confident routing, and an intuitive interface that ensures ease of use. Provide powerful reporting tools to drive performance, along with a mobile app that enables calling and texting on the go.

---

## 📊 Executive Summary

### What We're Building
A unified communications platform for KIN Solar that manages all customer and employee interactions from initial sale through installation and beyond. The platform integrates calling, texting, voicemail, contact management, intelligent routing, and comprehensive analytics into a single, manager-configurable system.

### Key Business Drivers
- **20-30 employees** managing **~200 active customers** through their solar installation journey
- **6+ departments** need visibility into customer communications
- **Project Coordinators (PCs)** own customer relationships but don't know when other departments interact with their customers
- **No unified system** - multiple disconnected tools causing confusion and dropped balls
- **Manual routing** wastes time and frustrates customers
- **No performance visibility** - can't track SLAs or agent effectiveness

### Success Metrics
- 85%+ call handle rate
- <30 second average speed of answer
- 95%+ callback compliance within SLA
- 90%+ text response compliance (30 minutes)
- 4.0+ average customer satisfaction score
- Zero missed customer handoffs between departments

---

## 👥 User Personas & Use Cases

### Internal Users

#### Project Coordinators (PCs)
- **Role**: Own customer relationships from sale to installation
- **Needs**: See all interactions with their customers, know who's contacting them, manage pre-PTO projects
- **Pain Points**: Blindsided when permitting/scheduling contacts their customers

#### Customer Support Team
- **Role**: Handle post-installation (post-PTO) customer issues
- **Needs**: Quick access to customer history, clear handoffs from PCs
- **Pain Points**: Don't know project history or who to escalate to

#### Department Teams
- **Permitting**: Handle permit applications
- **Interconnection**: Manage utility connections
- **Scheduling**: Coordinate installation appointments
- **RTR (Real-Time Response)**: Support field crews during installations

#### Field Crews
- **Role**: On-site installation teams
- **Needs**: Call for design deviations, check in/out of jobs, report issues
- **Pain Points**: Can't be reached through office system, use personal phones

#### Sales Reps
- **Role**: Customer acquisition
- **Needs**: Receive lead notifications and updates
- **Pain Points**: Disconnected from main system, use personal phones

#### Managers
- **Role**: Oversee operations and performance
- **Needs**: Configure routing, monitor KPIs, ensure SLA compliance
- **Pain Points**: Can't change routing without IT, no visibility into metrics

### External Users

#### Customers
- **Pre-PTO**: Going through sales, permitting, installation process
- **Post-PTO**: System is operational, may need support
- **Needs**: Reach the right person quickly, consistent experience

---

## 🏗️ Platform Architecture

### Technology Stack
```yaml
Frontend:
  - Next.js 14 with TypeScript
  - Tailwind CSS + shadcn/ui components
  - Real-time updates via Socket.io

Backend:
  - Node.js + Express for webhooks
  - PostgreSQL (Neon) for data storage
  - Redis/Upstash for caching
  - WebSocket server for live updates

Integrations:
  - Twilio: Voice, SMS, TaskRouter
  - QuickBase: CRM data sync
  - Arrivy: Job scheduling for field crews
  - AWS S3: Recording storage

Deployment:
  - Vercel: Frontend + API routes
  - Railway/Render: Webhook server
  - Neon: Managed PostgreSQL
```

### System Components

#### 1. Communications Core
- **Inbound/Outbound Calling**: Browser-based with Twilio
- **SMS/MMS Messaging**: Two-way conversations with threading
- **Voicemail System**: Auto-transcription, visual queue, callback tracking
- **Call Recording**: Automatic dual-channel recording for all calls
- **IVR Menus**: Configurable routing based on customer input

#### 2. Contact Management System
- **Unified Contacts Database**: Customers, employees, vendors, crews
- **QuickBase Integration**: Real-time sync of customer data
- **Smart Filtering**: Active/inactive status, staleness rules
- **Project Context**: PC assignment, project stage, PTO status
- **Interaction History**: Complete timeline of all communications

#### 3. Intelligent Routing Engine
- **Project-Based Routing**: PRE-PTO → PC, POST-PTO → Support
- **Skills-Based Distribution**: Match calls to qualified agents
- **Department Queues**: Separate queues for each team
- **Time-Based Rules**: Business hours, holidays, after-hours
- **Fallback Logic**: Automatic escalation when primary unavailable

#### 4. Manager Configuration Portal
- **Visual Routing Builder**: Drag-and-drop rule creation
- **Skills Management**: Assign capabilities to agents
- **IVR Designer**: Create menus without code
- **Business Hours**: Set schedules per department/line
- **SLA Configuration**: Define callback and response requirements
- **Phone Number Management**: Buy, configure, release numbers

#### 5. Analytics & Reporting Platform
- **Real-Time Dashboard**: Live KPIs and queue status
- **Historical Analytics**: Trends by hour, day, week, month
- **Agent Performance**: Individual and team metrics
- **SLA Compliance**: Track violations and alerts
- **Custom Reports**: Build and schedule reports
- **Survey Integration**: Customer satisfaction tracking


---

## 🔧 Feature Requirements

### Phase 2 Core Features (MVP)

#### 1. Enhanced Contacts Tab

##### Two-Section Structure
**Customers Section**
- Display all QuickBase-synced customers
- Show Project Coordinator assignment prominently
- Include project status (PRE-PTO/POST-PTO) and stage
- Filter by active/inactive status categories
- Apply staleness rules to hide old contacts
- Display last interaction details
- Show SLA violations (overdue callbacks/texts)
- Enable click-to-call and click-to-text
- Include unread message/voicemail indicators

**Employees Section**
- Manual management of KIN staff
- Include role and department information
- Show phone/email contact details
- Indicate if they can receive system calls
- Simple list view (no complex filtering needed)

##### Status Categories
- **ACTIVE**: Active, On Hold, Finance Hold, HOA Hold, Roof Hold, Pending KCA, Complete, Pending Permit, Pending Interconnection
- **INACTIVE**: Cancelled, Lost, Rejected, ROR, Duplicate, Test Account

##### Staleness Rules
- Active/On Hold: Hide after 6 months no contact
- Hold types: Hide after 3 months no contact
- Complete: Hide after 6 months no contact

##### Search Functionality
- Search across all contacts (including hidden)
- Search by name, phone, address, QuickBase ID
- Search by PC name or department
- Show context when displaying hidden/inactive results

#### 2. Smart Call Routing

##### Customer Support Line
**IVR Flow**:
```
Press 1: Customer Support
  - If POST-PTO → Customer Support Queue
  - If PRE-PTO → Overflow to Support Queue
  
Press 2: Project Coordination  
  - If PRE-PTO → Assigned PC
  - If PC unavailable → Support Queue
  - If POST-PTO → Support Queue
  
Press 3: Leave Voicemail
  - Transcribe automatically
  - Create QuickBase ticket
  - Email notification to manager
```

**Business Hours**: 8 AM - 6 PM CST, Monday-Friday
**After Hours**: Voicemail with next-day callback SLA

##### RTR Line (+1 435 515 3552)
**IVR Flow**:
```
Press 1: Design Deviation
  - Route to: Amador Bala (Priority 1)
  - Fallback: Deven Smith (Priority 2)
  
Press 2: Job Check-In/Out
  - Route to: Xam Conga (Priority 1)
  - Fallback: Carlo Mendoza (Priority 2)
  - Fallback: Dylan Kennedy (Priority 3)
  - Integration: Verify with Arrivy
  
Press 3: Field Support
  - Route to: RTR General Queue
  - Create ticket if no answer
```

**Business Hours**: 6 AM - 7 PM CST, Monday-Saturday
**Caller ID**: Auto-match to crew in QuickBase, save unknown numbers

#### 3. SLA Management

##### Callback Requirements
- Voicemail before 3 PM: Same day callback
- Voicemail after 3 PM: Next business day
- Missed calls: Follow up within 1 hour
- Automatic escalation for violations

##### Text Response Requirements
- Business hours: 30-minute first response
- After hours: Next business day 9 AM
- Thread tracking: Monitor open vs resolved
- Manager alerts for overdue responses

#### 4. Analytics Dashboard

##### Real-Time Metrics (10-second refresh)
- Handle Rate: % of calls answered
- Missed Call Rate: % not answered live
- Average Speed of Answer (ASA)
- Abandon Rate: % hung up before answer
- Current queue depth
- Longest current wait time
- Active agents by queue

##### SLA Compliance (1-minute refresh)
- Callback compliance percentage
- Text response compliance percentage
- List of overdue items with urgency
- Time until next SLA breach

##### Volume Analytics (5-minute refresh)
- Inbound volume by hour/day/month
- Outbound volume by agent
- Queue distribution
- Peak time identification
- Comparative trends

##### Agent Performance
- Calls per agent
- Average handle time
- Skill match success rate
- Fallback route usage
- Utilization percentage

##### Customer Satisfaction
- Average survey score (1-5)
- Google Review conversion rate
- Negative feedback queue
- Response rate to surveys

#### 5. Post-Call Survey Flow

**Trigger**: End of call
**Opt-in Message**: "Would you like to rate your experience?"

**Positive Experience (4-5 rating)**:
- Send Google Review link via SMS
- Track conversion to review
- Log in customer record

**Negative Experience (1-3 rating)**:
- Create high-priority callback ticket
- Assign to Project Coordinator or Support Manager
- 4-hour SLA for follow-up
- Track resolution

#### 6. Manager Configuration Interface

##### Routing Rules Management
- Visual drag-and-drop builder
- Test mode before deployment
- Simulate call flows
- Version control for changes
- Rollback capability

##### Skills Assignment
- Define skill categories
- Assign skills to agents with priority levels
- Set queue skill requirements
- Enable dual-skilling for load balancing

##### Business Hours Configuration
- Set schedules per department
- Holiday calendar management
- After-hours message recording
- Temporary schedule overrides

##### Phone Number Management
- Search available numbers
- Purchase and configure
- Assign to departments/purposes
- Release unused numbers

---

## 📊 Database Schema

### Core Tables

```sql
-- Contacts (Customers, Employees, Vendors, Crews)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  type VARCHAR(50) NOT NULL,
  
  -- Customer fields
  quickbase_id VARCHAR(100) UNIQUE,
  project_coordinator_id UUID REFERENCES users(id),
  project_stage VARCHAR(50),
  project_status VARCHAR(50), -- PRE-PTO, POST-PTO
  sale_date DATE,
  install_date DATE,
  pto_date DATE,
  
  -- Status
  status VARCHAR(50) NOT NULL,
  status_category VARCHAR(20) GENERATED,
  is_stale BOOLEAN GENERATED,
  
  -- Interaction tracking
  last_contact_date TIMESTAMP,
  last_contact_by UUID REFERENCES users(id),
  last_contact_department VARCHAR(100),
  last_contact_type VARCHAR(20),
  unread_count INTEGER DEFAULT 0,
  
  -- SLA tracking
  voicemail_callback_due TIMESTAMP,
  text_response_due TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Employees/Agents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  twilio_worker_sid VARCHAR(255),
  skills TEXT[],
  can_receive_calls BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calls
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(255) UNIQUE,
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  direction VARCHAR(20),
  duration INTEGER,
  recording_url TEXT,
  recording_sid VARCHAR(255),
  transcription TEXT,
  status VARCHAR(50),
  queue_name VARCHAR(100),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  survey_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_sid VARCHAR(255),
  conversation_sid VARCHAR(255),
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  body TEXT,
  direction VARCHAR(20),
  status VARCHAR(50),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  response_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Routing Rules
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Metrics
CREATE TABLE call_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_hour TIMESTAMP,
  queue_name VARCHAR(100),
  agent_id UUID REFERENCES users(id),
  calls_offered INTEGER,
  calls_answered INTEGER,
  calls_abandoned INTEGER,
  total_talk_time INTEGER,
  total_ring_time INTEGER,
  callbacks_required INTEGER,
  callbacks_completed INTEGER,
  sla_violations INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 Integration Requirements

### Twilio Configuration

#### Required Services
- **TaskRouter**: Workspace with queues and workflows
- **Programmable Voice**: Inbound/outbound calling
- **Programmable Messaging**: SMS/MMS handling
- **Conversations API**: Message threading
- **Recording**: Dual-channel call recording
- **Transcription**: Voicemail to text

#### Phone Numbers
- Customer Support Line (configurable)
- RTR Line: +1 435 515 3552
- Additional department lines as needed

### QuickBase Integration

#### Sync Requirements
- Real-time customer data sync (5-minute intervals)
- Two-way communication logging
- Field mappings:
  - Customer info (name, phone, address)
  - Project status and stage
  - PC assignment
  - Sale/install dates

#### API Operations
```javascript
getCustomerByPhone(phone)
getCustomerById(id)
getAssignedPC(customerId)
updateCustomerLastContact(id, timestamp)
logCommunication(details)
createTicket(customerID, issue)
```

### Arrivy Integration (RTR Line)

#### Job Management
- Verify scheduled jobs for check-ins
- Log check-in/check-out times
- Match caller to crew member
- Alert for delays or issues
- Sync job status to QuickBase

---

## 📱 User Interface Requirements

### Design Principles
- **Clean & Professional**: Easy on the eyes for all-day use
- **Information Dense**: Maximum useful info without clutter
- **Context First**: Always show WHO and WHERE in the customer journey
- **Action Oriented**: One-click access to common tasks
- **Real-Time**: Live updates without page refreshes

### Main Navigation Structure
```
Dashboard (Queue View)
├── Queue Tab
│   ├── Waiting Calls
│   ├── Active Calls
│   └── Voicemails
├── Contacts Tab
│   ├── Customers (filtered)
│   └── Employees
├── History Tab
│   ├── Call History
│   ├── Messages
│   └── Recordings
├── Analytics Tab
│   ├── Real-Time Dashboard
│   ├── Reports
│   └── Surveys
└── Settings Tab
    ├── Routing Rules
    ├── Business Hours
    ├── Skills
    └── Phone Numbers
```

### Key UI Components

#### Queue View
- Three-column layout: Queue | Conversation | Customer Context
- Real-time queue depth and wait times
- Color-coded by urgency/SLA status
- One-click answer/transfer/hold actions

#### Contact Display
- Tabbed interface (Customers/Employees)
- Sortable columns with smart defaults
- Inline actions (call, text, email)
- Status badges and indicators
- QuickBase data in iframe when needed

#### Analytics Dashboard
- Grid of real-time metric cards
- Trend charts (hourly, daily, monthly)
- SLA violation alerts
- Drill-down capabilities

#### Manager Configuration
- Visual IVR builder
- Drag-and-drop routing rules
- Calendar for business hours
- Test mode with simulation

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up Neon PostgreSQL database
- [ ] Create core schema and migrations
- [ ] Build QuickBase sync service
- [ ] Implement basic Twilio webhooks
- [ ] Create authentication system

### Phase 2: Contact Management (Week 2)
- [ ] Build enhanced contacts tab
- [ ] Implement filtering and staleness
- [ ] Add PC assignment display
- [ ] Create search functionality
- [ ] Set up employee management

### Phase 3: Smart Routing (Week 3)
- [ ] Configure TaskRouter
- [ ] Build IVR menus
- [ ] Implement PRE/POST-PTO routing
- [ ] Set up RTR line special handling
- [ ] Create fallback mechanisms

### Phase 4: Manager Tools (Week 4)
- [ ] Build configuration interface
- [ ] Create routing rule builder
- [ ] Implement skills management
- [ ] Add business hours settings
- [ ] Enable phone number management

### Phase 5: Analytics (Week 5)
- [ ] Build real-time dashboard
- [ ] Implement SLA tracking
- [ ] Create volume analytics
- [ ] Add survey flow
- [ ] Set up reporting

### Phase 6: Polish & Launch (Week 6)
- [ ] Performance optimization
- [ ] Mobile app deployment
- [ ] User training
- [ ] Documentation
- [ ] Go-live support

---

## ✅ Success Criteria

### Technical Requirements
- Page load time < 2 seconds
- Real-time updates < 500ms latency
- Support 50+ concurrent users
- 99.9% uptime
- All calls recorded and accessible
- Complete audit trail

### Business Metrics
- Handle Rate > 85%
- Missed Call Rate < 15%
- Average Speed of Answer < 30 seconds
- Abandon Rate < 5%
- Callback Compliance > 95%
- Text Response Compliance > 90%
- Customer Satisfaction > 4.0/5.0

### Operational Goals
- PCs never surprised by other department contacts
- Support finds right contact in < 10 seconds
- Managers configure routing without IT help
- Complete visibility into all customer interactions
- RTR line handles all field crew needs
- Zero missed handoffs between departments

---

## 📝 Appendices

### A. API Endpoints Required

```typescript
// Core Operations
POST   /api/webhooks/twilio/voice
POST   /api/webhooks/twilio/sms
POST   /api/webhooks/twilio/status

// Contacts
GET    /api/contacts
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
POST   /api/contacts/:id/call
POST   /api/contacts/:id/sms

// Routing
GET    /api/routing/rules
POST   /api/routing/rules
PUT    /api/routing/rules/:id
POST   /api/routing/test

// Analytics
GET    /api/analytics/realtime
GET    /api/analytics/sla
GET    /api/analytics/reports

// Configuration
GET    /api/admin/settings
PUT    /api/admin/settings
POST   /api/admin/phone-numbers
```

### B. QuickBase Field Mappings

```javascript
{
  "customer_name": "field_147",
  "phone": "field_148",
  "project_status": "field_255",
  "assigned_pc": "field_346",
  "project_stage": "field_367",
  "sale_date": "field_122",
  "address": "field_98"
}
```

### C. Status Mapping Reference

```javascript
const STATUS_CATEGORIES = {
  ACTIVE: [
    'Active', 'On Hold', 'Finance Hold', 'HOA Hold',
    'Roof Hold', 'Pending KCA', 'Complete', 'Completed',
    'Pending Permit', 'Pending Interconnection'
  ],
  INACTIVE: [
    'Cancelled', 'Lost', 'Rejected', 'ROR',
    'Duplicate', 'Test Account'
  ]
};
```

### D. SLA Definitions

```yaml
Voicemail Callback:
  Before 3 PM: Same business day
  After 3 PM: Next business day by noon
  Escalation: Manager notification after 1 hour overdue

Text Response:
  Business Hours: 30 minutes
  After Hours: Next business day 9 AM
  Escalation: Team lead after 15 minutes overdue

Missed Call:
  Follow-up: Within 1 hour
  Escalation: Immediate notification
```

---

## 🤝 Stakeholder Sign-off

- **Product Owner**: Director of Internal Operations
- **Technical Lead**: Engineering Team
- **Project Coordinators**: PC Team Lead
- **Customer Support**: Support Manager
- **RTR Team**: Field Operations Manager

---

*End of Master Requirements Document - Version 2.0*