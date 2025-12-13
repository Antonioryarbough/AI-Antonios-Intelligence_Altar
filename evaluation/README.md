# AI Enterprise Studio - Evaluation Framework

## Overview

Comprehensive evaluation framework for testing the AI Enterprise Studio's Stripe webhook integration, Firebase Firestore operations, and overall application functionality.

## Evaluation Components

### Evaluators

1. **WebhookSignatureEvaluator**
   - Validates Stripe webhook signature verification
   - Ensures HMAC-SHA256 signature correctness
   - Prevents unauthorized webhook calls

2. **GiftUnlockAccuracyEvaluator**
   - Checks if gifts are correctly unlocked in Firestore
   - Verifies gift unlock status matches payment completion
   - Validates user-specific gift ownership

3. **FirestoreDataIntegrityEvaluator**
   - Validates correct Firestore document paths
   - Ensures proper data structure (flat dict with boolean values)
   - Verifies path pattern: `artifacts/{appId}/users/{userId}/gifts/unlocked`

4. **ErrorHandlingEvaluator**
   - Tests proper error responses for invalid requests
   - Validates HTTP status codes
   - Ensures meaningful error messages

5. **ResponseTimeEvaluator**
   - Measures webhook processing latency
   - Threshold: 3000ms (configurable)
   - Scores performance: excellent (<900ms), good (<2100ms), acceptable (<3000ms)

6. **MetadataExtractionEvaluator**
   - Validates extraction of giftId, userId, appId from checkout session
   - Ensures correct metadata parsing
   - Critical for gift unlock automation

### Test Dataset

`test_data.jsonl` contains 8 test scenarios:

1. ✅ Valid signature with successful unlock
2. ❌ Invalid signature (should reject)
3. ❌ Missing metadata (should return 400)
4. ✅ Heart fireworks gift unlock
5. ⚠️ Wrong document path (data integrity issue)
6. ⚠️ Slow response (performance issue)
7. ❌ Metadata extraction error
8. ❌ Missing signature header

## Setup

### Prerequisites

```bash
# Install Azure AI Evaluation SDK
pip install azure-ai-evaluation

# Install required dependencies
pip install azure-identity python-dotenv
```

### Environment Variables

No environment variables required for local evaluation testing.

For production Azure AI integration (optional):
```bash
# Set these if you want to track evaluation results in Azure AI Studio
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP_NAME="your-resource-group"
export AZURE_PROJECT_NAME="your-project-name"
```

## Running Evaluations

### Quick Start

```bash
cd C:\Users\Banga\Studio
python evaluation/run_evaluation.py
```

### Expected Output

```
================================================================================
AI ENTERPRISE STUDIO - EVALUATION FRAMEWORK
================================================================================

Evaluating: Stripe Webhook Integration & Firebase Operations
Dataset: evaluation/test_data.jsonl

Running evaluation with 6 evaluators...

================================================================================
EVALUATION RESULTS
================================================================================

📊 AGGREGATE METRICS:
--------------------------------------------------------------------------------
  Webhook Signature Verification            : 87.50%
  Gift Unlock Accuracy                      : 87.50%
  Firestore Data Integrity                  : 93.75%
  Error Handling                            : 100.00%
  Response Time                             : 83.33%
  Metadata Extraction                       : 87.50%

--------------------------------------------------------------------------------

🎯 Overall Pass Rate: 89.58%
📝 Total Test Cases: 8

================================================================================
✅ Evaluation complete! Detailed results saved to:
   C:\Users\Banga\Studio\evaluation\evaluation_results.json
================================================================================
```

## Evaluation Results

Results are saved to `evaluation_results.json` with:

- **Row-level data**: Individual scores and reasons for each test case
- **Aggregate metrics**: Summary statistics across all tests
- **Per-evaluator metrics**: Detailed performance for each evaluator

### Sample Results Structure

```json
{
  "metrics": {
    "webhook_signature.score": 0.875,
    "gift_unlock.score": 0.875,
    "firestore_integrity.score": 0.9375,
    "error_handling.score": 1.0,
    "response_time.score": 0.8333,
    "metadata_extraction.score": 0.875,
    "pass_rate": 0.8958
  },
  "rows": [
    {
      "test_name": "valid_signature",
      "outputs.webhook_signature.score": 1.0,
      "outputs.webhook_signature.reason": "Signature validation correct...",
      "outputs.gift_unlock.score": 1.0,
      ...
    }
  ]
}
```

## Integration with Cloudflare Worker

### Testing Your Deployed Worker

To test your actual deployed Cloudflare Worker:

1. **Create a test webhook in Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Click "Test in a local environment" or use Stripe CLI
   - Send test events to your Worker URL

2. **Monitor Firestore**:
   - Check Firebase Console for document updates
   - Verify gifts are unlocked at correct paths

3. **Update test data** with real responses:
   ```bash
   # Use Stripe CLI to send test webhooks
   stripe trigger checkout.session.completed
   
   # Capture response times and status codes
   # Update test_data.jsonl accordingly
   ```

## Continuous Evaluation

### Automated Testing

Add to your CI/CD pipeline:

```yaml
# .github/workflows/evaluate.yml
name: Evaluate Gift Shop Automation

on:
  push:
    branches: [main]
  pull_request:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install azure-ai-evaluation azure-identity
      - name: Run evaluation
        run: python evaluation/run_evaluation.py
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: evaluation-results
          path: evaluation/evaluation_results.json
```

## Extending the Framework

### Adding New Evaluators

1. Create evaluator class in `evaluators.py`:

```python
class CustomEvaluator:
    def __init__(self):
        self.description = "Your evaluator description"
    
    def __call__(self, *, param1: str, param2: int, **kwargs) -> Dict[str, Any]:
        # Your evaluation logic
        score = calculate_score(param1, param2)
        
        return {
            "score": score,
            "reason": "Explanation of score"
        }
```

2. Add test cases to `test_data.jsonl`
3. Register in `run_evaluation.py`

### Adding New Test Scenarios

Append to `test_data.jsonl`:

```json
{"test_name": "new_scenario", "param1": "value", "param2": 123, ...}
```

## Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'azure.ai.evaluation'`
```bash
pip install azure-ai-evaluation
```

**Issue**: Test data not found
```bash
# Ensure you're running from the correct directory
cd C:\Users\Banga\Studio
python evaluation/run_evaluation.py
```

**Issue**: Low scores on response time
- Check Cloudflare Worker performance
- Consider optimizing Firestore write operations
- Review JWT token caching logic

## Next Steps

1. **Run initial evaluation**: `python evaluation/run_evaluation.py`
2. **Test with live Worker**: Send real Stripe webhooks to your Worker
3. **Update test data**: Add test cases based on production scenarios
4. **Set up monitoring**: Track evaluation metrics over time
5. **Integrate with CI/CD**: Automate evaluation on code changes

## Support

For issues or questions:
- Check Worker logs: `wrangler tail`
- Review Firestore security rules
- Verify Stripe webhook configuration
- Check evaluation results in `evaluation_results.json`
