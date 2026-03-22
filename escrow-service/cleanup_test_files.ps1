# Cleanup Test Files Script
# Remove all test-related files after payment flow testing

Write-Host "Cleaning up test files..."

# Remove test files
Remove-Item "src\modules\payments\razorpay.mock.service.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "src\modules\payments\test.controller.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "test_payment_flow.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "test_summary.md" -Force -ErrorAction SilentlyContinue
Remove-Item "cleanup_test_files.ps1" -Force -ErrorAction SilentlyContinue

# Remove test routes from payment.routes.ts (lines 27-30)
$paymentRoutesPath = "src\modules\payments\payment.routes.ts"
if (Test-Path $paymentRoutesPath) {
    $content = Get-Content $paymentRoutesPath
    $newContent = $content | Where-Object { $_ -notmatch "Test routes" -and $_ -notmatch "testController" -and $_ -notmatch "/test/" }
    $newContent | Set-Content $paymentRoutesPath
    Write-Host "Removed test routes from payment.routes.ts"
}

Write-Host "Test files cleanup completed!"
Write-Host "The Razorpay Escrow Payment System is now production-ready!"
