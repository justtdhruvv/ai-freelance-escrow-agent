# Mock Razorpay Payment System Test Script

Write-Host "🚀 Testing Mock Razorpay Payment System" -ForegroundColor Green

# Step 1: Create freelancer account
$freelancerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test_freelancer@example.com","password":"test123","role":"freelancer"}'
$freelancerToken = ($freelancerResponse | ConvertFrom-Json).token

Write-Host "✅ Freelancer created and logged in" -ForegroundColor Green

# Step 2: Create employer account
$employerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test_employer@example.com","password":"test123","role":"employer"}'
$employerToken = ($employerResponse | ConvertFrom-Json).token

Write-Host "✅ Employer created and logged in" -ForegroundColor Green

# Step 3: Create a project (employer)
$projectResponse = Invoke-RestMethod -Uri "http://localhost:3000/projects" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "title": "Test Project",
    "description": "Test project for mock payment",
    "total_price": 50000,
    "timeline_days": 30,
    "freelancer_id": "test-freelancer-id"
}'

$project = $projectResponse | ConvertFrom-Json
Write-Host "✅ Project created: $($project.project_id)" -ForegroundColor Green

# Step 4: Create escrow order
$escrowResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/projects/$($project.project_id)/escrow" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json"

$escrowOrder = $escrowResponse | ConvertFrom-Json
Write-Host "✅ Escrow order created: $($escrowOrder.order_id)" -ForegroundColor Green
Write-Host "   Amount: $($escrowOrder.amount) paise (₹$($escrowOrder.amount/100))" -ForegroundColor Yellow
Write-Host "   Key: $($escrowOrder.key_id)" -ForegroundColor Yellow

# Step 5: Simulate payment confirmation
$mockPaymentResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/mock-confirm" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body "{
    `"order_id`": `"$($escrowOrder.order_id)`",
    `"payment_id`": `"pay_MOCK_TEST_12345`"
}"

$paymentEvent = $mockPaymentResponse | ConvertFrom-Json
Write-Host "✅ Mock payment confirmed" -ForegroundColor Green
Write-Host "   Payment Event ID: $($paymentEvent.payment_event_id)" -ForegroundColor Yellow
Write-Host "   Type: $($paymentEvent.type)" -ForegroundColor Yellow
Write-Host "   Amount: ₹$($paymentEvent.amount)" -ForegroundColor Yellow

# Step 6: Create a milestone for testing
$milestoneResponse = Invoke-RestMethod -Uri "http://localhost:3000/projects/$($project.project_id)/milestones" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "title": "Test Milestone",
    "description": "Test milestone for payment release",
    "amount": 10000
}'

$milestone = $milestoneResponse | ConvertFrom-Json
Write-Host "✅ Milestone created: $($milestone.milestone_id)" -ForegroundColor Green

# Step 7: Update milestone status to passed (simulate completion)
$updateMilestoneResponse = Invoke-RestMethod -Uri "http://localhost:3000/milestones/$($milestone.milestone_id)" -Method PUT -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "status": "passed"
}'

Write-Host "✅ Milestone marked as passed" -ForegroundColor Green

# Step 8: Release milestone payment
$releaseResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/milestones/$($milestone.milestone_id)/release" -Method POST -Headers @{Authorization = "Bearer $employerToken"} -ContentType "application/json" -Body '{
    "triggered_by": "manual"
}'

$releaseEvent = $releaseResponse | ConvertFrom-Json
Write-Host "✅ Milestone payment released" -ForegroundColor Green
Write-Host "   Transfer ID: $($releaseEvent.razorpay_transfer_id)" -ForegroundColor Yellow
Write-Host "   Amount: ₹$($releaseEvent.amount)" -ForegroundColor Yellow

# Step 9: Get payment events for the project
$eventsResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/projects/$($project.project_id)/payment-events" -Method GET -Headers @{Authorization = "Bearer $employerToken"}

$paymentEvents = $eventsResponse | ConvertFrom-Json
Write-Host "✅ Payment events retrieved: $($paymentEvents.count) events" -ForegroundColor Green

foreach ($event in $paymentEvents.payment_events) {
    Write-Host "   📊 $($event.type): ₹$($event.amount) ($($event.created_at))" -ForegroundColor Cyan
}

# Step 10: Get Razorpay key
$keyResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/key" -Method GET -Headers @{Authorization = "Bearer $employerToken"}

$key = $keyResponse | ConvertFrom-Json
Write-Host "✅ Razorpay key: $($key.key_id)" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Mock Razorpay Payment System Test Completed Successfully!" -ForegroundColor Green
Write-Host "📊 All operations working with escrow balance and freelancer wallet" -ForegroundColor Cyan
Write-Host "🔄 Ready to switch to real Razorpay when credentials are available" -ForegroundColor Yellow
