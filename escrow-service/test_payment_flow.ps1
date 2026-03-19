# Test Payment Flow Script

# Step 1: Create freelancer account
$freelancerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test_freelancer@example.com","password":"test123","role":"freelancer"}'
$freelancerToken = ($freelancerResponse | ConvertFrom-Json).token

Write-Host "Freelancer created and logged in"

# Step 2: Test complete payment flow
$testResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/test/complete-flow" -Method POST -Headers @{Authorization = "Bearer $freelancerToken"} -ContentType "application/json" -Body '{"project_amount":50000,"milestone_amount":10000}'

Write-Host "Payment flow test completed"
Write-Host ($testResponse | ConvertFrom-Json | ConvertTo-Json -Depth 10)

# Step 3: Get mock status
$mockStatus = Invoke-RestMethod -Uri "http://localhost:3000/payments/test/mock-status" -Method GET -Headers @{Authorization = "Bearer $freelancerToken"}
Write-Host "Mock Status:"
Write-Host ($mockStatus | ConvertFrom-Json | ConvertTo-Json -Depth 10)

# Step 4: Clear mock data (optional)
# $clearResponse = Invoke-RestMethod -Uri "http://localhost:3000/payments/test/clear-mock-data" -Method DELETE -Headers @{Authorization = "Bearer $freelancerToken"}
# Write-Host "Mock data cleared"

Write-Host "End-to-end payment flow test completed!"
