# TeamFlow User Flows

This document contains detailed user flow diagrams for all major features of TeamFlow, using Mermaid flowchart syntax.

## Table of Contents
1. [User Registration & Onboarding](#1-user-registration--onboarding)
2. [User Authentication](#2-user-authentication)
3. [Project & Task Management](#3-project--task-management)
4. [Sprint Planning](#4-sprint-planning)
5. [AI Task Breakdown](#5-ai-task-breakdown)
6. [Team Collaboration](#6-team-collaboration)

---

## 1. User Registration & Onboarding

### 1.1 Email/Password Registration Flow

```mermaid
flowchart TD
    Start([User visits TeamFlow]) --> LandingPage[Display Landing Page]
    LandingPage --> ClickSignup{User clicks Sign Up}

    ClickSignup --> RegistrationForm[Display Registration Form]
    RegistrationForm --> EnterDetails[User enters:<br/>- Email<br/>- Name<br/>- Password]

    EnterDetails --> ValidateClient{Client-side<br/>validation}
    ValidateClient -->|Invalid| ShowErrors[Show validation errors<br/>inline]
    ShowErrors --> EnterDetails

    ValidateClient -->|Valid| SubmitForm[Submit to API]
    SubmitForm --> ValidateServer{Server-side<br/>validation}

    ValidateServer -->|Email exists| ErrorEmailExists[Show: Email already registered]
    ErrorEmailExists --> RegistrationForm

    ValidateServer -->|Password weak| ErrorPassword[Show: Password requirements<br/>not met]
    ErrorPassword --> RegistrationForm

    ValidateServer -->|Valid| CreateUser[Create User record<br/>Hash password with bcrypt]
    CreateUser --> GenerateToken[Generate email<br/>verification token]
    GenerateToken --> SendEmail[Send verification email<br/>via SendGrid/Resend]

    SendEmail --> CheckEmailSent{Email sent<br/>successfully?}
    CheckEmailSent -->|No| ErrorEmail[Show: Email service error<br/>Try again later]
    ErrorEmail --> End1([End])

    CheckEmailSent -->|Yes| SuccessMessage[Show: Check your email<br/>to verify account]
    SuccessMessage --> WaitingPage[Display waiting page]

    WaitingPage --> UserChecksEmail[User opens email]
    UserChecksEmail --> ClickVerifyLink{Clicks verification<br/>link}

    ClickVerifyLink --> ValidateToken{Token valid?<br/>Not expired?}
    ValidateToken -->|Expired| ErrorExpired[Show: Link expired<br/>Resend verification]
    ErrorExpired --> ResendOption{User requests<br/>resend?}
    ResendOption -->|Yes| GenerateToken
    ResendOption -->|No| End2([End])

    ValidateToken -->|Invalid| ErrorInvalid[Show: Invalid link]
    ErrorInvalid --> End3([End])

    ValidateToken -->|Valid| MarkVerified[Update User:<br/>emailVerified = true]
    MarkVerified --> CreateSession[Create JWT tokens:<br/>- Access token 15 min<br/>- Refresh token 7 days]
    CreateSession --> RedirectOnboarding[Redirect to onboarding]
    RedirectOnboarding --> OnboardingFlow[Start Onboarding Flow]
    OnboardingFlow --> End4([End])
```

### 1.2 OAuth Registration Flow

```mermaid
flowchart TD
    Start([User visits TeamFlow]) --> LandingPage[Display Landing Page]
    LandingPage --> ClickGoogleSignup[User clicks<br/>Continue with Google]

    ClickGoogleSignup --> RedirectGoogle[Redirect to Google<br/>OAuth consent screen]
    RedirectGoogle --> UserConsent{User grants<br/>permission?}

    UserConsent -->|Denied| CancelMessage[Show: Sign up cancelled]
    CancelMessage --> End1([End])

    UserConsent -->|Approved| GoogleCallback[Google redirects back<br/>with auth code]
    GoogleCallback --> ExchangeToken[Exchange auth code<br/>for access token]
    ExchangeToken --> FetchProfile[Fetch user profile<br/>from Google API]

    FetchProfile --> CheckUserExists{Email already<br/>in system?}

    CheckUserExists -->|Yes| CheckProvider{Same provider?}
    CheckProvider -->|No| ErrorProvider[Show: Email registered<br/>with different method]
    ErrorProvider --> End2([End])

    CheckProvider -->|Yes| LoginExisting[Log in existing user]
    LoginExisting --> CreateSession1[Create JWT tokens]
    CreateSession1 --> RedirectDashboard1[Redirect to dashboard]
    RedirectDashboard1 --> End3([End])

    CheckUserExists -->|No| CreateUser[Create User record:<br/>- provider = google<br/>- providerId = googleId<br/>- emailVerified = true<br/>- passwordHash = null]
    CreateUser --> CreateSession2[Create JWT tokens]
    CreateSession2 --> RedirectOnboarding[Redirect to onboarding]
    RedirectOnboarding --> OnboardingFlow[Start Onboarding Flow]
    OnboardingFlow --> End4([End])
```

### 1.3 First-Time Onboarding Flow

```mermaid
flowchart TD
    Start([User completes registration]) --> CheckFirstLogin{First time<br/>user?}

    CheckFirstLogin -->|No| RedirectDashboard[Redirect to dashboard]
    RedirectDashboard --> End1([End])

    CheckFirstLogin -->|Yes| WelcomeScreen[Show welcome screen<br/>with progress indicator 1/5]
    WelcomeScreen --> SkipOption1{User clicks skip?}
    SkipOption1 -->|Yes| ConfirmSkip[Show: Are you sure?]
    ConfirmSkip --> ConfirmYes{Confirms skip?}
    ConfirmYes -->|Yes| MarkComplete[Mark onboarding complete]
    MarkComplete --> RedirectDashboard
    ConfirmYes -->|No| WelcomeScreen

    SkipOption1 -->|No| Step1Start[Step 1: Create Workspace<br/>Progress: 1/5]
    Step1Start --> WorkspaceForm[Show workspace form<br/>Pre-filled name suggestion]
    WorkspaceForm --> EnterWorkspace[User enters:<br/>- Name<br/>- Description optional<br/>- Logo optional]

    EnterWorkspace --> ValidateWorkspace{Valid?}
    ValidateWorkspace -->|No| ShowWorkspaceError[Show validation errors]
    ShowWorkspaceError --> WorkspaceForm

    ValidateWorkspace -->|Yes| CreateWorkspace[Create Workspace<br/>User becomes Owner]
    CreateWorkspace --> Step2Start[Step 2: Create Project<br/>Progress: 2/5]

    Step2Start --> ShowTemplates[Show project templates:<br/>- Kanban<br/>- Scrum<br/>- Bug Tracking]
    ShowTemplates --> SelectTemplate[User selects template]
    SelectTemplate --> ProjectForm[Show project form<br/>Pre-filled from template]
    ProjectForm --> EnterProject[User enters:<br/>- Name<br/>- Description<br/>- Icon]

    EnterProject --> ValidateProject{Valid?}
    ValidateProject -->|No| ShowProjectError[Show validation errors]
    ShowProjectError --> ProjectForm

    ValidateProject -->|Yes| CreateProject[Create Project<br/>User becomes Admin]
    CreateProject --> Step3Start[Step 3: Create Task<br/>Progress: 3/5]

    Step3Start --> TaskForm[Show task form<br/>Demo task suggested]
    TaskForm --> EnterTask[User enters:<br/>- Title<br/>- Description<br/>- Priority<br/>- Story points]

    EnterTask --> ValidateTask{Valid?}
    ValidateTask -->|No| ShowTaskError[Show validation errors]
    ShowTaskError --> TaskForm

    ValidateTask -->|Yes| CreateTask[Create Task in project]
    CreateTask --> Step4Start[Step 4: Try AI Breakdown<br/>Progress: 4/5]

    Step4Start --> ShowAIDemo[Show interactive demo:<br/>AI breaks down task<br/>into subtasks]
    ShowAIDemo --> TryAI[User sees AI suggestions<br/>Can accept/modify]
    TryAI --> AIComplete[Demo complete]
    AIComplete --> Step5Start[Step 5: Invite Team<br/>Progress: 5/5]

    Step5Start --> InviteForm[Show invite form<br/>Can skip this step]
    InviteForm --> SkipInvite{Skip invites?}
    SkipInvite -->|Yes| OnboardingDone[Onboarding complete!<br/>Show celebration]

    SkipInvite -->|No| EnterEmails[User enters emails<br/>Selects roles]
    EnterEmails --> SendInvites[Send invitation emails]
    SendInvites --> OnboardingDone

    OnboardingDone --> MarkOnboardingComplete[Mark user.onboardingComplete = true]
    MarkOnboardingComplete --> RedirectProjectBoard[Redirect to project board<br/>with demo data]
    RedirectProjectBoard --> End2([End])
```

---

## 2. User Authentication

### 2.1 Login Flow

```mermaid
flowchart TD
    Start([User visits login page]) --> LoginForm[Display login form]
    LoginForm --> EnterCredentials[User enters:<br/>- Email<br/>- Password<br/>- Remember me checkbox]

    EnterCredentials --> SubmitLogin[Submit login request]
    SubmitLogin --> RateLimit{Rate limit<br/>exceeded?}

    RateLimit -->|Yes 10+ attempts| ErrorRateLimit[Show: Too many attempts<br/>Try again in 1 hour]
    ErrorRateLimit --> End1([End])

    RateLimit -->|No| FindUser{User exists<br/>with email?}
    FindUser -->|No| ErrorInvalid1[Show: Invalid credentials]
    ErrorInvalid1 --> LoginForm

    FindUser -->|Yes| CheckLocked{Account<br/>locked?}
    CheckLocked -->|Yes| CheckLockExpired{Lock expired?}
    CheckLockExpired -->|No| ErrorLocked[Show: Account locked<br/>Try again in X minutes]
    ErrorLocked --> End2([End])

    CheckLockExpired -->|Yes| UnlockAccount[Reset failedLoginAttempts<br/>Clear lockedUntil]
    UnlockAccount --> VerifyPassword

    CheckLocked -->|No| VerifyPassword{Password<br/>correct?}
    VerifyPassword -->|No| IncrementFailed[Increment failedLoginAttempts]
    IncrementFailed --> CheckLockThreshold{Attempts >= 5?}
    CheckLockThreshold -->|Yes| LockAccount[Set lockedUntil<br/>+15 minutes]
    LockAccount --> ErrorLocked
    CheckLockThreshold -->|No| ErrorInvalid2[Show: Invalid credentials]
    ErrorInvalid2 --> LoginForm

    VerifyPassword -->|Yes| CheckEmailVerified{Email<br/>verified?}
    CheckEmailVerified -->|No| ErrorNotVerified[Show: Please verify email<br/>Resend link option]
    ErrorNotVerified --> End3([End])

    CheckEmailVerified -->|Yes| ResetFailedAttempts[Reset failedLoginAttempts to 0<br/>Update lastLoginAt]
    ResetFailedAttempts --> CheckRememberMe{Remember me<br/>checked?}

    CheckRememberMe -->|Yes| CreateLongSession[Create JWT tokens:<br/>- Access 15 min<br/>- Refresh 30 days]
    CheckRememberMe -->|No| CreateShortSession[Create JWT tokens:<br/>- Access 15 min<br/>- Refresh 7 days]

    CreateLongSession --> StoreSession1[Store refresh token<br/>Set secure httpOnly cookie]
    CreateShortSession --> StoreSession2[Store refresh token<br/>Set secure httpOnly cookie]

    StoreSession1 --> GetLastPage[Get last visited page<br/>from session]
    StoreSession2 --> GetLastPage

    GetLastPage --> RedirectUser[Redirect to last page<br/>or default dashboard]
    RedirectUser --> End4([End])
```

### 2.2 Password Reset Flow

```mermaid
flowchart TD
    Start([User on login page]) --> ClickForgot[User clicks<br/>Forgot Password]
    ClickForgot --> ResetForm[Display reset form]
    ResetForm --> EnterEmail[User enters email]

    EnterEmail --> SubmitReset[Submit reset request]
    SubmitReset --> FindUser{User exists<br/>with email?}

    FindUser -->|No| GenericSuccess[Show: If account exists,<br/>reset link sent<br/>Same message for security]
    FindUser -->|Yes| GenerateToken[Generate unique<br/>reset token]

    GenerateToken --> HashToken[Hash token with bcrypt]
    HashToken --> StoreToken[Store PasswordReset:<br/>- userId<br/>- hashedToken<br/>- expiresAt +1 hour<br/>- used = false]

    StoreToken --> SendResetEmail[Send reset email<br/>with link containing token]
    SendResetEmail --> GenericSuccess
    GenericSuccess --> End1([End])

    SendResetEmail --> UserChecksEmail[User opens email]
    UserChecksEmail --> ClickResetLink[User clicks reset link]
    ClickResetLink --> ValidateToken{Token valid<br/>and not expired?}

    ValidateToken -->|Expired| ErrorExpired[Show: Link expired<br/>Request new reset]
    ErrorExpired --> End2([End])

    ValidateToken -->|Used| ErrorUsed[Show: Link already used<br/>Request new reset]
    ErrorUsed --> End3([End])

    ValidateToken -->|Invalid| ErrorInvalid[Show: Invalid reset link]
    ErrorInvalid --> End4([End])

    ValidateToken -->|Valid| NewPasswordForm[Display new password form]
    NewPasswordForm --> EnterNewPassword[User enters:<br/>- New password<br/>- Confirm password]

    EnterNewPassword --> ValidatePassword{Password valid?<br/>Min 8 chars<br/>1 upper, lower, number}
    ValidatePassword -->|No| ShowPasswordError[Show validation errors]
    ShowPasswordError --> NewPasswordForm

    ValidatePassword -->|Passwords match?| CheckMatch{Passwords<br/>match?}
    CheckMatch -->|No| ErrorMismatch[Show: Passwords don't match]
    ErrorMismatch --> NewPasswordForm

    CheckMatch -->|Yes| HashNewPassword[Hash new password<br/>with bcrypt]
    HashNewPassword --> UpdateUser[Update User.passwordHash]
    UpdateUser --> MarkTokenUsed[Mark PasswordReset.used = true]
    MarkTokenUsed --> InvalidateSessions[Invalidate all existing<br/>user sessions/tokens]

    InvalidateSessions --> CreateNewSession[Create new JWT tokens]
    CreateNewSession --> AutoLogin[Auto-login user]
    AutoLogin --> ShowSuccess[Show: Password reset successful]
    ShowSuccess --> RedirectDashboard[Redirect to dashboard]
    RedirectDashboard --> End5([End])
```

### 2.3 Token Refresh Flow

```mermaid
flowchart TD
    Start([User makes API request]) --> CheckAccessToken{Access token<br/>valid?}

    CheckAccessToken -->|Valid| ProcessRequest[Process request normally]
    ProcessRequest --> End1([End])

    CheckAccessToken -->|Expired| Return401[Return 401 Unauthorized<br/>with error code]
    Return401 --> ClientDetects[Client detects 401<br/>Token expired error]

    ClientDetects --> CheckRefreshToken{Has refresh<br/>token?}
    CheckRefreshToken -->|No| RedirectLogin[Redirect to login]
    RedirectLogin --> End2([End])

    CheckRefreshToken -->|Yes| SendRefreshRequest[Send refresh token<br/>to /auth/refresh endpoint]
    SendRefreshRequest --> ValidateRefresh{Refresh token<br/>valid?}

    ValidateRefresh -->|Invalid| ErrorInvalid[Return: Invalid token]
    ValidateRefresh -->|Expired| ErrorExpired[Return: Token expired]
    ErrorInvalid --> ClearTokens1[Clear tokens from storage]
    ErrorExpired --> ClearTokens1
    ClearTokens1 --> RedirectLogin

    ValidateRefresh -->|Revoked| ErrorRevoked[Return: Token revoked]
    ErrorRevoked --> ClearTokens1

    ValidateRefresh -->|Valid| CheckUserActive{User account<br/>active?}
    CheckUserActive -->|No| ErrorInactive[Return: Account inactive]
    ErrorInactive --> ClearTokens1

    CheckUserActive -->|Yes| GenerateNewTokens[Generate new tokens:<br/>- New access token 15 min<br/>- New refresh token same expiry]
    GenerateNewTokens --> UpdateRefreshToken[Update refresh token in DB<br/>Invalidate old token]
    UpdateRefreshToken --> ReturnTokens[Return new tokens to client]

    ReturnTokens --> StoreNewTokens[Client stores new tokens]
    StoreNewTokens --> RetryOriginalRequest[Retry original API request<br/>with new access token]
    RetryOriginalRequest --> ProcessRequest
```

---

## 3. Project & Task Management

### 3.1 Create Project Flow

```mermaid
flowchart TD
    Start([User in workspace]) --> ClickNewProject[User clicks<br/>New Project button]
    ClickNewProject --> CheckPermissions{User has<br/>create permission?}

    CheckPermissions -->|No Owner/Admin/Member| ErrorPermission[Show: Insufficient permissions]
    ErrorPermission --> End1([End])

    CheckPermissions -->|Yes| ShowModal[Display create project modal]
    ShowModal --> ShowTemplates[Show template options:<br/>- Kanban<br/>- Scrum<br/>- Bug Tracking<br/>- Blank]

    ShowTemplates --> SelectTemplate[User selects template]
    SelectTemplate --> ProjectForm[Display project form<br/>Pre-filled based on template]
    ProjectForm --> EnterDetails[User enters:<br/>- Name required<br/>- Description optional<br/>- Icon/emoji optional<br/>- Visibility public/private]

    EnterDetails --> ValidateClient{Client-side<br/>validation}
    ValidateClient -->|Invalid| ShowErrors[Show inline errors]
    ShowErrors --> EnterDetails

    ValidateClient -->|Valid| SubmitCreate[Submit to API]
    SubmitCreate --> ValidateServer{Server-side<br/>validation}

    ValidateServer -->|Name too short| ErrorName[Show: Name 3-100 chars required]
    ErrorName --> ProjectForm

    ValidateServer -->|Duplicate name| ErrorDuplicate[Show: Project name exists<br/>Choose different name]
    ErrorDuplicate --> ProjectForm

    ValidateServer -->|Valid| CreateProject[Create Project record:<br/>- Generate UUID<br/>- Set createdBy<br/>- Set creator as Admin<br/>- Apply template settings]

    CreateProject --> ApplyTemplate{Template<br/>selected?}
    ApplyTemplate -->|Kanban| CreateKanbanColumns[Create default columns:<br/>Todo, In Progress, Done]
    ApplyTemplate -->|Scrum| CreateScrumSetup[Create default columns<br/>+ Enable sprint features]
    ApplyTemplate -->|Bug Tracking| CreateBugColumns[Create columns:<br/>Reported, Triaging, etc.]
    ApplyTemplate -->|Blank| SkipTemplate[Skip template setup]

    CreateKanbanColumns --> BroadcastCreate
    CreateScrumSetup --> BroadcastCreate
    CreateBugColumns --> BroadcastCreate
    SkipTemplate --> BroadcastCreate[Broadcast to WebSocket:<br/>PROJECT_CREATED event]

    BroadcastCreate --> LogActivity[Create Activity record:<br/>- action: created<br/>- entityType: project]
    LogActivity --> CloseModal[Close modal]
    CloseModal --> RedirectProject[Redirect to project board<br/>/w/workspace/p/project]
    RedirectProject --> End2([End])
```

### 3.2 Create Task Flow

```mermaid
flowchart TD
    Start([User viewing project board]) --> ClickNewTask[User clicks<br/>New Task or + button]
    ClickNewTask --> CheckPermissions{User has<br/>create permission?}

    CheckPermissions -->|No Viewer| ErrorPermission[Show: Insufficient permissions]
    ErrorPermission --> End1([End])

    CheckPermissions -->|Yes| QuickCreate{Quick create<br/>or full form?}

    QuickCreate -->|Quick| ShowQuickInput[Show inline input field]
    ShowQuickInput --> EnterTitle[User types title]
    EnterTitle --> PressEnter{Presses Enter?}
    PressEnter -->|No Escape| CancelQuick[Cancel creation]
    CancelQuick --> End2([End])

    PressEnter -->|Yes| ValidateTitle{Title valid?<br/>3-200 chars}
    ValidateTitle -->|No| ShowQuickError[Show error inline]
    ShowQuickError --> EnterTitle

    ValidateTitle -->|Yes| CreateQuickTask[Create Task:<br/>- Title only<br/>- Default status todo<br/>- Default priority medium<br/>- createdBy current user]
    CreateQuickTask --> AddToBoard1[Add to board at position 0]
    AddToBoard1 --> BroadcastQuick[Broadcast TASK_CREATED]
    BroadcastQuick --> End3([End])

    QuickCreate -->|Full| ShowTaskModal[Display full task form]
    ShowTaskModal --> EnterAllDetails[User enters:<br/>- Title required<br/>- Description markdown<br/>- Assignees multi-select<br/>- Priority dropdown<br/>- Story points<br/>- Due date picker<br/>- Labels multi-select]

    EnterAllDetails --> AddAttachments{Add<br/>attachments?}
    AddAttachments -->|Yes| UploadFiles[User drags/selects files]
    UploadFiles --> ValidateFiles{Files valid?<br/>Each < 10MB<br/>Total < 50MB}
    ValidateFiles -->|No| ShowFileError[Show: File size limits]
    ShowFileError --> AddAttachments
    ValidateFiles -->|Yes| UploadToS3[Upload to S3/R2<br/>Get URLs]
    UploadToS3 --> StoreAttachments[Store Attachment records]

    AddAttachments -->|No| ValidateForm{Form valid?}
    StoreAttachments --> ValidateForm

    ValidateForm -->|Invalid| ShowFormErrors[Show validation errors]
    ShowFormErrors --> EnterAllDetails

    ValidateForm -->|Valid| SubmitTask[Submit to API]
    SubmitTask --> CreateTask[Create Task record<br/>with all fields]
    CreateTask --> CreateAssignments[Create TaskAssignee<br/>records for each assignee]
    CreateAssignments --> CreateLabels[Create TaskLabel<br/>records for each label]
    CreateLabels --> CalculatePosition[Calculate position<br/>in status column]
    CalculatePosition --> AddToBoard2[Add to board<br/>at calculated position]

    AddToBoard2 --> BroadcastFull[Broadcast TASK_CREATED<br/>to workspace members]
    BroadcastFull --> NotifyAssignees[Send notifications<br/>to assignees]
    NotifyAssignees --> LogActivity[Create Activity record]
    LogActivity --> CloseModal[Close modal]
    CloseModal --> ShowTaskCard[Display new task card<br/>on board]
    ShowTaskCard --> End4([End])
```

### 3.3 Update Task Status (Drag-and-Drop on Kanban)

```mermaid
flowchart TD
    Start([User viewing Kanban board]) --> DragStart[User starts dragging<br/>task card]
    DragStart --> CheckPermissions{User can<br/>edit task?}

    CheckPermissions -->|No| ShowError[Show: Cannot move task<br/>Insufficient permissions]
    ShowError --> RevertDrag[Revert drag visually]
    RevertDrag --> End1([End])

    CheckPermissions -->|Yes Owner/Admin/Assigned| ShowDropZones[Highlight valid<br/>drop zones]
    ShowDropZones --> UserDrags[User drags over columns]
    UserDrags --> HoverColumn[Highlight target column]
    HoverColumn --> DropTask[User drops task]

    DropTask --> DetectChange{Status<br/>changed?}
    DetectChange -->|No Same column| UpdatePositionOnly[Update position only<br/>within same column]
    UpdatePositionOnly --> SendPositionUpdate[Send position update API]
    SendPositionUpdate --> End2([End])

    DetectChange -->|Yes| GetNewStatus[Get new status from<br/>target column]
    GetNewStatus --> OptimisticUpdate[Optimistic UI update:<br/>Move card immediately]
    OptimisticUpdate --> CalculateNewPosition[Calculate new position<br/>in target column]

    CalculateNewPosition --> SendUpdate[Send PATCH request:<br/>- taskId<br/>- new status<br/>- new position<br/>- current version]

    SendUpdate --> CheckVersion{Version<br/>matches?}
    CheckVersion -->|No Conflict| ErrorConflict[Return 409 Conflict:<br/>Task modified by another user]
    ErrorConflict --> RevertOptimistic[Revert optimistic update]
    RevertOptimistic --> ShowConflictModal[Show conflict resolution modal:<br/>- Your changes<br/>- Their changes<br/>- Options to retry/reload]
    ShowConflictModal --> UserChoice{User<br/>choice?}
    UserChoice -->|Retry| SendUpdate
    UserChoice -->|Reload| FetchLatest[Fetch latest task state]
    FetchLatest --> UpdateUI1[Update UI with latest]
    UpdateUI1 --> End3([End])

    CheckVersion -->|Yes| ValidateTransition{Valid status<br/>transition?}
    ValidateTransition -->|Invalid| ErrorTransition[Return: Invalid transition]
    ErrorTransition --> RevertOptimistic

    ValidateTransition -->|Valid| UpdateTask[Update Task:<br/>- status = new status<br/>- position = new position<br/>- version++<br/>- updatedAt = now]

    UpdateTask --> ReorderTasks[Reorder other tasks<br/>in both columns]
    ReorderTasks --> LogStatusChange[Create Activity:<br/>- action: status_changed<br/>- changes: old → new]

    LogStatusChange --> BroadcastUpdate[Broadcast to WebSocket:<br/>TASK_UPDATED event<br/>with new version]
    BroadcastUpdate --> CheckBlocked{Status =<br/>blocked?}
    CheckBlocked -->|Yes| NotifyOwner[Notify task creator<br/>and assignees]
    CheckBlocked -->|No| CheckDone{Status =<br/>done?}
    CheckDone -->|Yes| CelebrateAnimation[Show celebration<br/>animation in UI]
    CelebrateAnimation --> UpdateMetrics[Update sprint metrics<br/>if task in sprint]

    NotifyOwner --> ReturnSuccess1[Return 200 with<br/>updated task + version]
    UpdateMetrics --> ReturnSuccess1
    CheckDone -->|No| ReturnSuccess1

    ReturnSuccess1 --> UpdateBoardUI[Update board UI<br/>with confirmed position]
    UpdateBoardUI --> OtherClients[Other clients receive<br/>WebSocket update]
    OtherClients --> UpdateOtherBoards[Update other users' boards<br/>in real-time]
    UpdateOtherBoards --> End4([End])
```

### 3.4 Add Comment with @Mention

```mermaid
flowchart TD
    Start([User viewing task details]) --> ClickComment[User clicks<br/>Add Comment field]
    ClickComment --> FocusEditor[Focus markdown editor]
    FocusEditor --> TypeComment[User types comment]

    TypeComment --> DetectAt{Types @<br/>character?}
    DetectAt -->|No| ContinueTyping[Continue typing]
    ContinueTyping --> SubmitReady{Ready to<br/>submit?}

    DetectAt -->|Yes| ShowMentionMenu[Show autocomplete menu<br/>with workspace members]
    ShowMentionMenu --> FilterMembers[Filter members<br/>as user types]
    FilterMembers --> SelectMember{User selects<br/>member?}
    SelectMember -->|No Esc| CancelMention[Close menu]
    CancelMention --> ContinueTyping

    SelectMember -->|Yes| InsertMention[Insert @mention:<br/>Display as @name<br/>Store as userId]
    InsertMention --> HighlightMention[Highlight mention<br/>in editor]
    HighlightMention --> ContinueTyping

    SubmitReady -->|Preview| ShowPreview[Show markdown preview]
    ShowPreview --> EditMore{Continue<br/>editing?}
    EditMore -->|Yes| TypeComment
    EditMore -->|No| SubmitReady

    SubmitReady -->|Submit| ValidateComment{Comment valid?<br/>1-5000 chars<br/>Not empty}
    ValidateComment -->|Invalid| ShowError[Show validation error]
    ShowError --> TypeComment

    ValidateComment -->|Valid| ParseMentions[Parse comment:<br/>Extract all @mentions]
    ParseMentions --> CreateComment[Create Comment record:<br/>- taskId<br/>- userId<br/>- content markdown<br/>- createdAt]

    CreateComment --> SaveMentions[Store mentioned userIds<br/>in metadata]
    SaveMentions --> BroadcastComment[Broadcast to WebSocket:<br/>COMMENT_CREATED event]
    BroadcastComment --> CheckMentions{Has<br/>@mentions?}

    CheckMentions -->|No| UpdateTaskUI1[Update task UI<br/>Show new comment]
    CheckMentions -->|Yes| NotifyMentioned[Create notifications<br/>for mentioned users]
    NotifyMentioned --> SendEmails[Send email notifications:<br/>You were mentioned in task]
    SendEmails --> SendWebPush{Web push<br/>enabled?}
    SendWebPush -->|Yes| SendPushNotif[Send push notification]
    SendWebPush -->|No| UpdateTaskUI1
    SendPushNotif --> UpdateTaskUI1

    UpdateTaskUI1 --> LogActivity[Create Activity:<br/>- action: commented<br/>- entityType: comment]
    LogActivity --> IncrementCount[Increment task<br/>comment count]
    IncrementCount --> UpdateOtherUsers[Other users see update<br/>via WebSocket]
    UpdateOtherUsers --> ShowSuccess[Show comment<br/>with rendered markdown]
    ShowSuccess --> ClearEditor[Clear comment editor]
    ClearEditor --> End([End])
```

---

## 4. Sprint Planning

### 4.1 Create Sprint Flow

```mermaid
flowchart TD
    Start([User in project with<br/>Scrum template]) --> ClickNewSprint[User clicks<br/>Create Sprint button]
    ClickNewSprint --> CheckPermissions{User has<br/>permission?}

    CheckPermissions -->|No Member/Viewer| ErrorPermission[Show: Only Owner/Admin<br/>can create sprints]
    ErrorPermission --> End1([End])

    CheckPermissions -->|Yes| CheckActiveSprint{Active sprint<br/>exists?}
    CheckActiveSprint -->|Yes| ErrorActive[Show: Complete current sprint<br/>before starting new one]
    ErrorActive --> End2([End])

    CheckActiveSprint -->|No| ShowSprintModal[Display create sprint modal]
    ShowSprintModal --> SuggestName[Suggest name:<br/>Sprint + number]
    SuggestName --> SprintForm[Display sprint form:<br/>- Name<br/>- Goal<br/>- Start date<br/>- End date<br/>- Duration days]

    SprintForm --> EnterDetails[User enters details]
    EnterDetails --> CalculateDuration{Auto-calculate<br/>duration?}
    CalculateDuration -->|Yes| UpdateDuration[Show duration in days<br/>between dates]
    UpdateDuration --> EnterDetails

    CalculateDuration -->|No Submit| ValidateForm{Form valid?}
    ValidateForm -->|Name empty| ErrorName[Show: Name required 3-100 chars]
    ErrorName --> SprintForm

    ValidateForm -->|Invalid dates| ErrorDates[Show: Start must be before end<br/>Recommended 1-4 weeks]
    ErrorDates --> SprintForm

    ValidateForm -->|Dates overlap| ErrorOverlap[Show: Sprint dates overlap<br/>with existing sprint]
    ErrorOverlap --> SprintForm

    ValidateForm -->|Valid| SubmitCreate[Submit to API]
    SubmitCreate --> CreateSprint[Create Sprint record:<br/>- projectId<br/>- name, goal<br/>- startDate, endDate<br/>- status = planned]

    CreateSprint --> LogActivity[Create Activity:<br/>action: created]
    LogActivity --> BroadcastCreate[Broadcast SPRINT_CREATED]
    BroadcastCreate --> CloseModal[Close modal]
    CloseModal --> ShowSprint[Display sprint in list<br/>Status: Planned]
    ShowSprint --> PromptAddTasks[Show: Add tasks to sprint?]

    PromptAddTasks --> UserChoice{User<br/>chooses?}
    UserChoice -->|Add tasks| OpenBacklog[Open backlog view]
    OpenBacklog --> End3([End])
    UserChoice -->|Later| End4([End])
```

### 4.2 AI-Assisted Sprint Planning Flow

```mermaid
flowchart TD
    Start([User in sprint planning view]) --> ClickAIAssist[User clicks<br/>AI Sprint Planning button]
    ClickAIAssist --> ShowAIModal[Display AI assistant modal]
    ShowAIModal --> ShowContext[Show context:<br/>- Team velocity<br/>- Available tasks<br/>- Sprint capacity<br/>- Team members]

    ShowContext --> ConfigureAI[User configures:<br/>- Sprint duration<br/>- Team members<br/>- Focus areas optional<br/>- Constraints]
    ConfigureAI --> ClickGenerate[User clicks Generate Plan]
    ClickGenerate --> ShowLoading[Show: AI analyzing...<br/>Loading animation]

    ShowLoading --> CallAI[Call AI API:<br/>POST /ai/sprint-plan<br/>- backlog tasks<br/>- team velocity<br/>- sprint capacity<br/>- priorities]

    CallAI --> AIProcessing[AI processes:<br/>- Analyzes task complexity<br/>- Considers dependencies<br/>- Balances workload<br/>- Respects capacity]

    AIProcessing --> CheckAIResponse{AI response<br/>successful?}
    CheckAIResponse -->|Error| ShowAIError[Show: AI service error<br/>Try manual planning]
    ShowAIError --> End1([End])

    CheckAIResponse -->|Success| ParseSuggestions[Parse AI suggestions:<br/>- Recommended tasks<br/>- Story point estimates<br/>- Task assignments<br/>- Risk warnings]

    ParseSuggestions --> ShowSuggestions[Display suggestions:<br/>- Task list with scores<br/>- Capacity utilization<br/>- Team balance chart<br/>- Risk indicators]

    ShowSuggestions --> GroupByPriority[Group tasks:<br/>- Must have High confidence<br/>- Should have Medium<br/>- Could have Low<br/>- Won't have Excluded]

    GroupByPriority --> UserReview[User reviews suggestions]
    UserReview --> ModifyPlan{User wants to<br/>modify?}

    ModifyPlan -->|Yes| ShowControls[Show modification controls:<br/>- Move tasks between groups<br/>- Adjust assignments<br/>- Override estimates<br/>- Add/remove tasks]
    ShowControls --> UserAdjusts[User makes adjustments]
    UserAdjusts --> RecalculateMetrics[Recalculate:<br/>- Total points<br/>- Capacity %<br/>- Balance score]
    RecalculateMetrics --> UpdateVisuals[Update visualizations]
    UpdateVisuals --> UserReview

    ModifyPlan -->|Regenerate| ProvideContext[User provides feedback:<br/>Too many/few tasks<br/>Wrong focus<br/>Reassign members]
    ProvideContext --> CallAI

    ModifyPlan -->|Accept| ConfirmPlan[Show confirmation:<br/>X tasks, Y points<br/>Z% capacity]
    ConfirmPlan --> UserConfirms{User confirms<br/>accept?}
    UserConfirms -->|No| UserReview

    UserConfirms -->|Yes| ApplyPlan[Apply plan to sprint]
    ApplyPlan --> CreateSprintTasks[Create SprintTask records<br/>for all accepted tasks]
    CreateSprintTasks --> UpdateAssignments[Update TaskAssignee records<br/>per AI suggestions]
    UpdateAssignments --> UpdateEstimates[Update Task.storyPoints<br/>if modified]

    UpdateEstimates --> LogAIActivity[Create Activity:<br/>- action: ai_sprint_planned<br/>- metadata: AI suggestions]
    LogAIActivity --> BroadcastUpdate[Broadcast SPRINT_UPDATED]
    BroadcastUpdate --> NotifyTeam[Notify team members<br/>of sprint assignments]
    NotifyTeam --> ShowSuccess[Show success message:<br/>Sprint planned with AI<br/>X tasks added]

    ShowSuccess --> CloseModal[Close AI modal]
    CloseModal --> UpdateSprintView[Update sprint view<br/>Show added tasks]
    UpdateSprintView --> ShowMetrics[Display metrics:<br/>- Velocity chart<br/>- Capacity utilization<br/>- Burndown forecast]
    ShowMetrics --> End2([End])
```

### 4.3 Add Tasks to Sprint

```mermaid
flowchart TD
    Start([User in sprint view]) --> ClickAddTasks[User clicks<br/>Add Tasks to Sprint]
    ClickAddTasks --> ShowBacklog[Display backlog modal<br/>with available tasks]
    ShowBacklog --> FilterOptions[Show filters:<br/>- Priority<br/>- Assignee<br/>- Labels<br/>- Story points]

    FilterOptions --> ApplyFilters{User applies<br/>filters?}
    ApplyFilters -->|Yes| UpdateList[Update task list<br/>matching filters]
    UpdateList --> SelectTasks
    ApplyFilters -->|No| SelectTasks[User selects tasks<br/>Multi-select checkboxes]

    SelectTasks --> ShowSelected[Show selected count<br/>and total points]
    ShowSelected --> CheckCapacity{Total points<br/>< sprint capacity?}
    CheckCapacity -->|No Overcommit| ShowWarning[Show warning:<br/>Exceeds recommended capacity]
    ShowWarning --> UserDecision{User wants to<br/>continue?}
    UserDecision -->|No| SelectTasks
    UserDecision -->|Yes| ConfirmAdd

    CheckCapacity -->|Yes| ConfirmAdd[User clicks Add to Sprint]
    ConfirmAdd --> ValidateSelection{Selection<br/>valid?}
    ValidateSelection -->|Empty| ShowError[Show: Select at least one task]
    ShowError --> SelectTasks

    ValidateSelection -->|Valid| SubmitAdd[Submit to API]
    SubmitAdd --> CheckTaskStatus{All tasks<br/>in todo?}
    CheckTaskStatus -->|No| ShowStatusWarning[Show: Some tasks in progress<br/>Are you sure?]
    ShowStatusWarning --> UserConfirms{User<br/>confirms?}
    UserConfirms -->|No| SelectTasks
    UserConfirms -->|Yes| CreateLinks

    CheckTaskStatus -->|Yes| CreateLinks[Create SprintTask records<br/>for each selected task]
    CreateLinks --> UpdateTasksMetadata[Update tasks:<br/>Add sprint reference]
    UpdateTasksMetadata --> LogActivity[Create Activity records:<br/>action: added_to_sprint]
    LogActivity --> BroadcastUpdate[Broadcast SPRINT_UPDATED<br/>and TASK_UPDATED events]
    BroadcastUpdate --> CloseModal[Close backlog modal]
    CloseModal --> UpdateSprintView[Update sprint view<br/>Show newly added tasks]
    UpdateSprintView --> RecalculateMetrics[Recalculate metrics:<br/>- Total points<br/>- Capacity %<br/>- Tasks count]
    RecalculateMetrics --> ShowSuccess[Show success notification:<br/>X tasks added to sprint]
    ShowSuccess --> End([End])
```

### 4.4 Complete Sprint

```mermaid
flowchart TD
    Start([User viewing active sprint]) --> ClickComplete[User clicks<br/>Complete Sprint]
    ClickComplete --> CheckPermissions{User has<br/>permission?}
    CheckPermissions -->|No| ErrorPermission[Show: Only Owner/Admin]
    ErrorPermission --> End1([End])

    CheckPermissions -->|Yes| CheckStatus{Sprint status<br/>= active?}
    CheckStatus -->|No| ErrorNotActive[Show: Sprint not active]
    ErrorNotActive --> End2([End])

    CheckStatus -->|Yes| AnalyzeTasks[Analyze sprint tasks]
    AnalyzeTasks --> CountTasks[Count:<br/>- Total tasks<br/>- Completed<br/>- In progress<br/>- Not started]
    CountTasks --> CheckIncomplete{Has incomplete<br/>tasks?}

    CheckIncomplete -->|Yes| ShowCompleteModal[Show completion modal:<br/>- X incomplete tasks<br/>- Options for handling]
    ShowCompleteModal --> ShowOptions[Show options:<br/>1. Move to backlog<br/>2. Move to next sprint<br/>3. Keep in this sprint]
    ShowOptions --> UserSelects[User selects option<br/>per task or bulk]

    CheckIncomplete -->|No All done| ConfirmComplete[Show confirmation:<br/>Complete sprint?]
    UserSelects --> ConfirmComplete

    ConfirmComplete --> UserConfirms{User<br/>confirms?}
    UserConfirms -->|No| End3([End])

    UserConfirms -->|Yes| ProcessIncompleteTasks{Handle incomplete<br/>tasks}
    ProcessIncompleteTasks -->|Move to backlog| RemoveFromSprint1[Remove from sprint<br/>Keep in project]
    ProcessIncompleteTasks -->|Next sprint| CheckNextSprint{Next sprint<br/>exists?}
    CheckNextSprint -->|No| CreateNextSprint[Suggest creating<br/>next sprint]
    CheckNextSprint -->|Yes| MoveToNext[Move tasks to next sprint<br/>Create SprintTask links]
    ProcessIncompleteTasks -->|Keep| KeepInSprint[Leave in completed sprint<br/>For reference]

    RemoveFromSprint1 --> UpdateSprintStatus
    MoveToNext --> UpdateSprintStatus
    CreateNextSprint --> UpdateSprintStatus
    KeepInSprint --> UpdateSprintStatus

    UpdateSprintStatus[Update Sprint:<br/>- status = completed<br/>- actualEndDate = now]
    UpdateSprintStatus --> CalculateMetrics[Calculate sprint metrics:<br/>- Velocity actual points<br/>- Completion rate %<br/>- Avg task duration<br/>- Burndown data]

    CalculateMetrics --> StoreMetrics[Store metrics in<br/>sprint metadata]
    StoreMetrics --> GenerateReport[Generate sprint report:<br/>- Summary statistics<br/>- Charts<br/>- Team performance<br/>- Lessons learned prompt]

    GenerateReport --> LogActivity[Create Activity:<br/>action: sprint_completed]
    LogActivity --> BroadcastComplete[Broadcast SPRINT_COMPLETED]
    BroadcastComplete --> NotifyTeam[Notify team members:<br/>Sprint completed]
    NotifyTeam --> ShowReport[Display sprint report<br/>in modal]

    ShowReport --> PromptRetro[Prompt: Schedule retrospective?]
    PromptRetro --> UserChoice{User<br/>choice?}
    UserChoice -->|Yes| OpenRetroForm[Open retrospective form<br/>Templates available]
    UserChoice -->|No| UpdateSprintList[Update sprint list<br/>Move to completed]
    OpenRetroForm --> UpdateSprintList

    UpdateSprintList --> ShowCelebration[Show celebration animation<br/>Sprint completed!]
    ShowCelebration --> End4([End])
```

---

## 5. AI Task Breakdown

### 5.1 AI Task Breakdown Flow

```mermaid
flowchart TD
    Start([User viewing task details]) --> ClickAIBreakdown[User clicks<br/>AI Breakdown button]
    ClickAIBreakdown --> CheckTaskContent{Task has<br/>sufficient details?}

    CheckTaskContent -->|No Missing title/desc| ShowPrompt[Show: Add more details<br/>for better breakdown]
    ShowPrompt --> UserAdds{User adds<br/>details?}
    UserAdds -->|No| End1([End])
    UserAdds -->|Yes| ClickAIBreakdown

    CheckTaskContent -->|Yes| ShowAIModal[Display AI breakdown modal]
    ShowAIModal --> ShowTaskContext[Show task context:<br/>- Title<br/>- Description<br/>- Current subtasks<br/>- Project type]

    ShowTaskContext --> ConfigureAI[User configures optional:<br/>- Level of detail<br/>- Max subtasks<br/>- Include estimates<br/>- Focus areas]
    ConfigureAI --> ClickGenerate[User clicks<br/>Generate Breakdown]
    ClickGenerate --> ShowLoading[Show: AI analyzing task...<br/>Loading animation]

    ShowLoading --> CallAI[Call AI API:<br/>POST /ai/task-breakdown<br/>- taskId<br/>- title<br/>- description<br/>- context]

    CallAI --> AIProcessing[AI processes:<br/>- Analyzes task complexity<br/>- Identifies logical steps<br/>- Considers best practices<br/>- Generates subtasks]

    AIProcessing --> CheckAIResponse{AI response<br/>successful?}
    CheckAIResponse -->|Timeout| ShowTimeout[Show: AI taking too long<br/>Try again or manual]
    ShowTimeout --> RetryOption{User wants<br/>to retry?}
    RetryOption -->|Yes| CallAI
    RetryOption -->|No| End2([End])

    CheckAIResponse -->|Error| ShowAIError[Show: AI service error<br/>Create subtasks manually]
    ShowAIError --> End3([End])

    CheckAIResponse -->|Success| ParseSuggestions[Parse AI response:<br/>- Subtask titles<br/>- Descriptions<br/>- Estimates<br/>- Dependencies<br/>- Confidence scores]

    ParseSuggestions --> CheckQuality{Quality check<br/>passes?}
    CheckQuality -->|Poor quality| ShowQualityWarning[Show: Low confidence results<br/>Consider refining task]
    ShowQualityWarning --> ShowSuggestions[Display AI suggestions]
    CheckQuality -->|Good| ShowSuggestions

    ShowSuggestions --> DisplaySubtasks[Display subtasks list:<br/>- Checkbox for each<br/>- Edit button<br/>- Delete button<br/>- Reorder drag handles<br/>- Confidence indicator]

    DisplaySubtasks --> UserReview[User reviews suggestions]
    UserReview --> ModifyPlan{User wants to<br/>modify?}

    ModifyPlan -->|Edit subtask| ShowEditForm[Show inline edit:<br/>Title and description]
    ShowEditForm --> UserEdits[User modifies text]
    UserEdits --> SaveEdit[Save edit locally]
    SaveEdit --> UserReview

    ModifyPlan -->|Delete subtask| MarkDeleted[Mark for deletion<br/>Gray out in list]
    MarkDeleted --> UserReview

    ModifyPlan -->|Add subtask| ShowAddForm[Show add subtask form]
    ShowAddForm --> UserAddsNew[User enters new subtask]
    UserAddsNew --> AddToList[Add to suggestion list]
    AddToList --> UserReview

    ModifyPlan -->|Reorder| DragDrop[User drags subtasks<br/>to reorder]
    DragDrop --> UpdateOrder[Update order in list]
    UpdateOrder --> UserReview

    ModifyPlan -->|Regenerate| ProvideFeedback[User provides feedback:<br/>Too detailed/vague<br/>Wrong focus<br/>Missing steps]
    ProvideFeedback --> CallAI

    ModifyPlan -->|Accept| SelectSubtasks[User selects which<br/>to create checked only]
    SelectSubtasks --> ConfirmCreate[Show confirmation:<br/>Create X subtasks?]
    ConfirmCreate --> UserConfirms{User<br/>confirms?}
    UserConfirms -->|No| UserReview

    UserConfirms -->|Yes| CreateSubtasks[Create Subtask records<br/>for selected items]
    CreateSubtasks --> SetPositions[Set positions 0, 1, 2...<br/>Based on order]
    SetPositions --> LinkToTask[Link all to parent taskId]
    LinkToTask --> UpdateTask[Update parent Task:<br/>Increment version]

    UpdateTask --> LogAIActivity[Create Activity:<br/>- action: ai_breakdown<br/>- metadata: AI used<br/>- changes: subtasks added]
    LogAIActivity --> BroadcastUpdate[Broadcast TASK_UPDATED<br/>with subtasks]
    BroadcastUpdate --> NotifyAssignees[Notify task assignees:<br/>Subtasks added]
    NotifyAssignees --> ShowSuccess[Show success:<br/>X subtasks created]

    ShowSuccess --> CloseModal[Close AI modal]
    CloseModal --> UpdateTaskView[Update task detail view<br/>Show new subtasks]
    UpdateTaskView --> ShowProgress[Display progress bar:<br/>0/X subtasks completed]
    ShowProgress --> End4([End])
```

---

## 6. Team Collaboration

### 6.1 Invite Team Member Flow

```mermaid
flowchart TD
    Start([User in workspace settings]) --> ClickInvite[User clicks<br/>Invite Members button]
    ClickInvite --> CheckPermissions{User has<br/>invite permission?}

    CheckPermissions -->|No Viewer/Member| ErrorPermission[Show: Only Owner/Admin<br/>can invite]
    ErrorPermission --> End1([End])

    CheckPermissions -->|Yes| ShowInviteModal[Display invite modal]
    ShowInviteModal --> ShowForm[Show invite form:<br/>- Email inputs<br/>- Role selector<br/>- Personal message<br/>- Bulk paste option]

    ShowForm --> InviteType{Single or<br/>bulk?}

    InviteType -->|Single| EnterEmail[User enters:<br/>- Email<br/>- Role Admin/Member/Viewer<br/>- Optional message]
    InviteType -->|Bulk| ShowBulkInput[Show bulk text area:<br/>Paste multiple emails]
    ShowBulkInput --> PasteEmails[User pastes emails<br/>One per line or comma-separated]
    PasteEmails --> ParseEmails[Parse and validate<br/>each email]
    ParseEmails --> ShowParsedList[Show parsed list:<br/>- Valid emails green<br/>- Invalid emails red<br/>- Duplicates marked]
    ShowParsedList --> SelectRole[User selects<br/>role for all]

    EnterEmail --> ValidateForm{Form valid?}
    SelectRole --> ValidateForm

    ValidateForm -->|Invalid email| ShowEmailError[Show: Invalid email format]
    ShowEmailError --> ShowForm

    ValidateForm -->|Empty| ShowEmptyError[Show: Enter at least one email]
    ShowEmptyError --> ShowForm

    ValidateForm -->|Valid| SubmitInvites[Submit to API]
    SubmitInvites --> ProcessEach[Process each email]

    ProcessEach --> CheckExists{Email already<br/>member?}
    CheckExists -->|Yes| SkipEmail[Skip email<br/>Add to already_member list]
    SkipEmail --> NextEmail{More<br/>emails?}

    CheckExists -->|No| CheckPending{Pending invite<br/>exists?}
    CheckPending -->|Yes| UpdateInvite[Update existing invite:<br/>- New role<br/>- New expiresAt<br/>- New token]
    CheckPending -->|No| CreateInvite[Create Invitation record:<br/>- email<br/>- workspaceId<br/>- role<br/>- Generate unique token<br/>- expiresAt +7 days<br/>- invitedBy userId]

    UpdateInvite --> SendInviteEmail
    CreateInvite --> SendInviteEmail[Send invitation email:<br/>- Workspace name<br/>- Inviter name<br/>- Accept link with token<br/>- Expires in 7 days]

    SendInviteEmail --> CheckEmailSent{Email sent<br/>successfully?}
    CheckEmailSent -->|No| LogEmailError[Log email failure<br/>Add to failed list]
    LogEmailError --> NextEmail

    CheckEmailSent -->|Yes| AddSuccess[Add to success list]
    AddSuccess --> NextEmail

    NextEmail -->|Yes| ProcessEach
    NextEmail -->|No| GenerateSummary[Generate summary:<br/>- X sent successfully<br/>- Y already members<br/>- Z failed]

    GenerateSummary --> LogActivity[Create Activity:<br/>action: members_invited<br/>metadata: count, emails]
    LogActivity --> BroadcastInvite[Broadcast INVITES_SENT<br/>to workspace]
    BroadcastInvite --> ShowSummary[Display summary modal<br/>with results]
    ShowSummary --> CloseModal[Close invite modal]
    CloseModal --> UpdatePendingList[Update pending invites list<br/>in settings]
    UpdatePendingList --> End2([End])
```

### 6.2 Accept Invitation Flow

```mermaid
flowchart TD
    Start([User receives invitation email]) --> ClickLink[User clicks<br/>invitation link]
    ClickLink --> ParseToken[Extract token<br/>from URL]
    ParseToken --> CallAPI[Call API:<br/>GET /invitations/token]

    CallAPI --> ValidateToken{Token valid<br/>and not expired?}
    ValidateToken -->|Invalid| ShowInvalidPage[Show: Invalid invitation link]
    ShowInvalidPage --> End1([End])

    ValidateToken -->|Expired| ShowExpiredPage[Show: Invitation expired<br/>Contact workspace owner]
    ShowExpiredPage --> End2([End])

    ValidateToken -->|Already accepted| ShowAcceptedPage[Show: Already accepted<br/>Redirect to login]
    ShowAcceptedPage --> End3([End])

    ValidateToken -->|Valid| GetInviteDetails[Get invitation details:<br/>- Workspace name<br/>- Role<br/>- Inviter name]
    GetInviteDetails --> CheckUserAuth{User logged in?}

    CheckUserAuth -->|No| ShowAuthOptions[Show page:<br/>- Workspace details<br/>- Accept button<br/>- Need to login/register]
    ShowAuthOptions --> UserChoosesAuth{User chooses<br/>action?}
    UserChoosesAuth -->|Login| RedirectLogin[Redirect to login<br/>with returnUrl]
    UserChoosesAuth -->|Register| RedirectRegister[Redirect to register<br/>with returnUrl]

    RedirectLogin --> CompleteAuth[User completes auth]
    RedirectRegister --> CompleteAuth
    CompleteAuth --> ReturnToInvite[Return to invitation page<br/>with token]
    ReturnToInvite --> CheckUserAuth

    CheckUserAuth -->|Yes| CheckEmailMatch{Email matches<br/>logged-in user?}
    CheckEmailMatch -->|No| ShowMismatch[Show: Email mismatch<br/>Login with invited email<br/>or contact admin]
    ShowMismatch --> OfferSwitch[Offer: Switch account?]
    OfferSwitch --> UserSwitches{User wants<br/>to switch?}
    UserSwitches -->|Yes| LogoutAndRedirect[Logout current user<br/>Redirect to login]
    LogoutAndRedirect --> CompleteAuth
    UserSwitches -->|No| End4([End])

    CheckEmailMatch -->|Yes| CheckAlreadyMember{Already member<br/>of workspace?}
    CheckAlreadyMember -->|Yes| ShowAlreadyMember[Show: Already a member<br/>Redirect to workspace]
    ShowAlreadyMember --> End5([End])

    CheckAlreadyMember -->|No| ShowAcceptPage[Show acceptance page:<br/>- Workspace details<br/>- Your role<br/>- Accept/Decline buttons]
    ShowAcceptPage --> UserDecision{User<br/>decision?}

    UserDecision -->|Decline| ConfirmDecline[Show: Are you sure?]
    ConfirmDecline --> UserConfirms1{Confirms<br/>decline?}
    UserConfirms1 -->|No| ShowAcceptPage
    UserConfirms1 -->|Yes| MarkDeclined[Mark invitation.accepted = false<br/>Add declinedAt timestamp]
    MarkDeclined --> NotifyInviter1[Notify inviter:<br/>User declined invitation]
    NotifyInviter1 --> ShowDeclined[Show: Invitation declined]
    ShowDeclined --> End6([End])

    UserDecision -->|Accept| ConfirmAccept[User clicks Accept]
    ConfirmAccept --> CreateMembership[Create WorkspaceMember:<br/>- userId<br/>- workspaceId<br/>- role from invitation<br/>- joinedAt = now]

    CreateMembership --> MarkAccepted[Update Invitation:<br/>- accepted = true<br/>- acceptedAt = now]
    MarkAccepted --> GrantPermissions[Grant user access<br/>to workspace resources]
    GrantPermissions --> LogActivity[Create Activity:<br/>action: member_joined<br/>userId, workspaceId]

    LogActivity --> BroadcastJoin[Broadcast MEMBER_JOINED<br/>to workspace]
    BroadcastJoin --> NotifyInviter2[Notify inviter:<br/>User accepted invitation]
    NotifyInviter2 --> NotifyMembers[Notify workspace members:<br/>New member joined]
    NotifyMembers --> ShowWelcome[Show welcome message:<br/>You've joined workspace!]
    ShowWelcome --> RedirectWorkspace[Redirect to workspace<br/>dashboard]
    RedirectWorkspace --> ShowTour{Show quick<br/>tour?}
    ShowTour -->|Yes| StartTour[Start workspace tour]
    ShowTour -->|No| End7([End])
    StartTour --> End8([End])
```

### 6.3 Real-Time Update Propagation Flow

```mermaid
flowchart TD
    Start([User A makes change]) --> ActionType{Type of<br/>action?}

    ActionType -->|Task update| UpdateTask[Update Task in database]
    ActionType -->|Comment| CreateComment[Create Comment in database]
    ActionType -->|Status change| UpdateStatus[Update status in database]
    ActionType -->|Assignment| UpdateAssignment[Update assignment in database]

    UpdateTask --> IncrementVersion[Increment task.version]
    CreateComment --> GetTaskVersion[Get current task.version]
    UpdateStatus --> IncrementVersion
    UpdateAssignment --> IncrementVersion

    IncrementVersion --> SaveDB[Save to database<br/>with transaction]
    GetTaskVersion --> SaveDB

    SaveDB --> CheckSuccess{Save<br/>successful?}
    CheckSuccess -->|No Conflict| ReturnError[Return 409 Conflict<br/>to User A]
    ReturnError --> End1([End])

    CheckSuccess -->|Yes| CreateActivity[Create Activity record<br/>for audit log]
    CreateActivity --> BuildWSMessage[Build WebSocket message:<br/>- eventType<br/>- entityType<br/>- entityId<br/>- changes<br/>- userId<br/>- timestamp<br/>- version]

    BuildWSMessage --> GetAffectedUsers[Query affected users:<br/>- Workspace members<br/>- Task assignees<br/>- Comment subscribers<br/>- Project members]

    GetAffectedUsers --> FilterOnlineUsers[Filter for users<br/>with active WS connections]
    FilterOnlineUsers --> GetWorkspaceId[Get workspaceId<br/>for filtering]
    GetWorkspaceId --> BroadcastWS[Broadcast to WebSocket<br/>room: workspace_ID]

    BroadcastWS --> ForEachClient[For each connected client]
    ForEachClient --> CheckPermissions{Client has<br/>permission to see?}

    CheckPermissions -->|No| SkipClient[Skip this client]
    SkipClient --> NextClient{More<br/>clients?}

    CheckPermissions -->|Yes| SendToClient[Send WS message<br/>to client]
    SendToClient --> ClientReceives[Client receives message]
    ClientReceives --> CheckClientState{Client viewing<br/>related page?}

    CheckClientState -->|No| StoreNotification[Store in notification queue<br/>Show badge count]
    StoreNotification --> NextClient

    CheckClientState -->|Yes| CheckVersion{Client version<br/>matches?}
    CheckVersion -->|No Stale| FetchLatest[Fetch latest data<br/>from API]
    FetchLatest --> UpdateClientUI1[Update entire UI section]
    UpdateClientUI1 --> NextClient

    CheckVersion -->|Yes| ApplyOptimistic{Optimistic update<br/>already applied?}
    ApplyOptimistic -->|Yes Same user| ConfirmOptimistic[Confirm optimistic update<br/>No visual change needed]
    ConfirmOptimistic --> NextClient

    ApplyOptimistic -->|No Other user| DetermineChangeType{Type of<br/>change?}

    DetermineChangeType -->|Task moved| AnimateMove[Animate task card<br/>moving to new position]
    DetermineChangeType -->|Field updated| AnimateUpdate[Highlight changed field<br/>Fade in new value]
    DetermineChangeType -->|Comment added| AnimateComment[Slide in new comment<br/>with highlight]
    DetermineChangeType -->|User assigned| ShowAssignee[Add assignee avatar<br/>with animation]

    AnimateMove --> UpdateClientUI2[Update client state]
    AnimateUpdate --> UpdateClientUI2
    AnimateComment --> UpdateClientUI2
    ShowAssignee --> UpdateClientUI2

    UpdateClientUI2 --> ShowNotification[Show toast notification:<br/>User X updated task]
    ShowNotification --> PlaySound{Sound<br/>enabled?}
    PlaySound -->|Yes| PlayNotifSound[Play subtle notification sound]
    PlaySound -->|No| NextClient
    PlayNotifSound --> NextClient

    NextClient -->|Yes| ForEachClient
    NextClient -->|No| CheckOfflineUsers{Offline users<br/>subscribed?}

    CheckOfflineUsers -->|Yes| CreateNotifications[Create Notification records<br/>for offline users]
    CreateNotifications --> QueueEmails{Email notifications<br/>enabled?}
    QueueEmails -->|Yes| QueueEmailJob[Queue email job<br/>for offline users]
    QueueEmails -->|No| UpdateCache
    QueueEmailJob --> UpdateCache[Update cache:<br/>Redis invalidation]

    CheckOfflineUsers -->|No| UpdateCache
    UpdateCache --> ReturnSuccess[Return success<br/>to User A]
    ReturnSuccess --> End2([End])
```

---

## Flow Diagram Legend

### Symbols Used
- **Rounded Rectangle**: Start/End points
- **Rectangle**: Process/Action steps
- **Diamond**: Decision points
- **Parallelogram**: Input/Output
- **Arrow**: Flow direction

### Color Coding (when rendered)
- **Green**: Success paths
- **Red**: Error paths
- **Yellow**: Warning/Alternative paths
- **Blue**: User interaction points

### Common Patterns

#### Error Handling
All flows include:
- Validation at multiple levels (client + server)
- Clear error messages
- Recovery options
- Graceful fallbacks

#### Real-Time Updates
Updates propagate via:
- WebSocket broadcasts
- Optimistic UI updates
- Version checking
- Conflict resolution

#### Security
All flows enforce:
- Permission checks
- Authentication requirements
- Rate limiting
- Token validation

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Status**: Ready for Implementation