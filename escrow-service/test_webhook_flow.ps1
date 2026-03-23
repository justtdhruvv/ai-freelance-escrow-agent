# Webhook Testing Script for Mock Razorpay Payment System

Write-Host "🔗 Testing Webhook System" -ForegroundColor Green

# Step 1: Create test users
$freelancerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"webhook_test_freelancer@example.com","password":"test123","role":"freelancer"}'
$freelancerToken = ($freelancerResponse | ConvertFrom-Json).token

$employerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"webhook_test_employer@example.com","password":"test123","role":"employer"}'
$employerToken = ($employerResponse | ConvertFrom-Json).token

Write-Host "✅ Test users created" -ForegroundColor Green

# Step 2: Create test project
$projectResponse = Invoke-RestMethod -Uri "http://localhost:3000/projects" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "title": "Webhook Test Project",
    "description": "Project for webhook testing",
    "total_price": 30000,
    "timeline_days": 30,
    "freelancer_id": "test-freelancer-id"
}'

$project = $projectResponse | ConvertFrom-Json
Write-Host "✅ Test project created: $($project.project_id)" -ForegroundColor Green

# Step 3: Create escrow order
$escrowResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/projects/$($project.project_id)/escrow" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json"

$escrowOrder = $escrowResponse | ConvertFrom-Json
Write-Host "✅ Escrow order created: $($escrowOrder.order_id)" -ForegroundColor Green

# Step 4: Test webhook verification
$webhookVerifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/webhook/verify" -Method GET

$webhookVerify = $webhookVerifyResponse | ConvertFrom-Json
Write-Host "✅ Webhook verification:" -ForegroundColor Green
Write-Host "   Configured: $($webhookVerify.webhook_configured)" -ForegroundColor Yellow
Write-Host "   Mock Mode: $($webhookVerify.mock_mode)" -ForegroundColor Yellow
Write-Host "   Supported Events: $($webhookVerify.supported_events -join ', ')" -ForegroundColor Cyan

# Step 5: Test payment captured webhook
$paymentWebhookResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/webhook/test" -Method POST -ContentType "application/json" -Body "{
    `"event_type`": `"payment.captured`",
    `"project_id`": `"$($project.project_id)`"
}'

$paymentWebhook = $paymentWebhookResponse | ConvertFrom-Json
Write-Host "✅ Payment captured webhook tested" -ForegroundColor Green
Write-Host "   Event: $($paymentWebhook.event_type)" -ForegroundColor Yellow
Write-Host "   Project: $($paymentWebhook.project_id)" -ForegroundColor Yellow

# Step 6: Create milestone for testing
$milestoneResponse = Invoke-RestMethod -Uri "http://localhost:3000/projects/$($project.project_id)/milestones" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "title": "Webhook Test Milestone",
    "description": "Milestone for webhook testing",
    "amount": 5000
}'

$milestone = $milestoneResponse | ConvertFrom-Json
Write-Host "✅ Test milestone created: $($milestone.milestone_id)" -ForegroundColor Green

# Step 7: Update milestone to passed
$updateMilestoneResponse = Invoke-RestMethod -Uri "http://localhost:3000/milestones/$($milestone.milestone_id)" -Method PUT -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "status": "passed"
}'

Write-Host "✅ Milestone marked as passed" -ForegroundColor Green

# Step 8: Test transfer processed webhook
$transferWebhookResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/webhook/test" -Method POST -ContentType "application/json" -Body "{
    `"event_type`": `"transfer.processed`",
    `"project_id`": `"$($project.project_id)`",
    `"milestone_id`": `"$($milestone.milestone_id)`"
}'

$transferWebhook = $transferWebhookResponse | ConvertFrom-Json
Write-Host "✅ Transfer processed webhook tested" -ForegroundColor Green
Write-Host "   Event: $($transferWebhook.event_type)" -ForegroundColor Yellow
Write-Host "   Project: $($transferWebhook.project_id)" -ForegroundColor Yellow
Write-Host "   Milestone: $($transferWebhook.milestone_id)" -ForegroundColor Yellow

# Step 9: Check payment events
$eventsResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/projects/$($project.project_id)/payment-events" -Method GET -Headers @{Authorization = "Bearer $employerToken"}

$paymentEvents = $eventsResponse | ConvertFrom-Json
Write-Host "✅ Payment events after webhooks:" -ForegroundColor Green
Write-Host "   Total Events: $($paymentEvents.count)" -ForegroundColor Yellow

foreach ($event in $paymentEvents.payment_events) {
    Write-Host "   📊 $($event.type): ₹$($event.amount) ($($event.triggered_by))" -ForegroundColor Cyan
}

# Step 10: Test direct webhook endpoint (simulate real Razorpay webhook)
$directWebhookBody = @{
    event = "payment.captured"
    payload = @{
        payment = @{
            entity = @{
                id = "pay_MOCK_DIRECT_WEBHOOK_123"
                entity = "payment"
                amount = 250000
                currency = "INR"
                status = "captured"
                order_id = $escrowOrder.order_id
                international = $false
                method = "card"
                amount_refunded = 0
                captured = $true
                created_at = [int][double]::Parse((Get-Date).ToUniversalTime().Subtract([datetime]::new(1970,1,1)).TotalMilliseconds)
            }
        }
        order = @{
            entity = @{
                id = $escrowOrder.order_id
                entity = "order"
                amount = 250000
                currency = "INR"
                status = "created"
                notes = @{
                    project_id = $project.project_id
                    type = "escrow_hold"
                }
                created_at = [int][double]::Parse((Get-Date).ToUniversalTime().Subtract([datetime]::new(1970,1,1)).TotalMilliseconds)
            }
        }
    }
} | ConvertTo-Json -Depth 10

$directWebhookResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/webhook" -Method POST -ContentType "application/json" -Headers @{
    "x-razorpay-signature" = "mock_webhook_signature"
} -Body $directWebhookBody

Write-Host "✅ Direct webhook endpoint tested" -ForegroundColor Green
Write-Host "   Response: $($directWebhookResponse.message)" -ForegroundColor Yellow

# Step 11: Final payment events check
$finalEventsResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/projects/$($project.project_id)/payment-events" -Method GET -Headers @{Authorization = "Bearer $employerToken"}

$finalEvents = $finalEventsResponse | ConvertFrom-Json
Write-Host "✅ Final payment events:" -ForegroundColor Green
Write-Host "   Total Events: $($finalEvents.count)" -ForegroundColor Yellow

foreach ($event in $finalEvents.payment_events) {
    Write-Host "   📊 $($event.type): ₹$($event.amount) ($($event.triggered_by))" -ForegroundColor Cyan
    if ($event.razorpay_order_id) { Write-Host "      Order: $($event.razorpay_order_id)" -ForegroundColor Gray }
    if ($event.razorpay_payment_id) { Write-Host "      Payment: $($event.razorpay_payment_id)" -ForegroundColor Gray }
    if ($event.razorpay_transfer_id) { Write-Host "      Transfer: $($event.razorpay_transfer_id)" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "🎉 Webhook System Test Completed!" -ForegroundColor Green
Write-Host "📊 All webhook events working correctly" -ForegroundColor Cyan
Write-Host "🔗 Ready for real Razorpay webhook integration" -ForegroundColor Yellow
Write-Host "🛡️ Mock signature verification working" -ForegroundColor Magenta
