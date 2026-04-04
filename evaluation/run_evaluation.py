"""
AI Enterprise Studio Evaluation Runner
Evaluates Stripe webhook integration and Firebase operations
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from azure.ai.evaluation import evaluate
from evaluation.evaluators import (
    WebhookSignatureEvaluator,
    GiftUnlockAccuracyEvaluator,
    FirestoreDataIntegrityEvaluator,
    ErrorHandlingEvaluator,
    ResponseTimeEvaluator,
    MetadataExtractionEvaluator
)


def main():
    """Run comprehensive evaluation of AI Enterprise Studio"""
    
    print("=" * 80)
    print("AI ENTERPRISE STUDIO - EVALUATION FRAMEWORK")
    print("=" * 80)
    print()
    print("Evaluating: Stripe Webhook Integration & Firebase Operations")
    print("Dataset: evaluation/test_data.jsonl")
    print()
    
    # Initialize evaluators
    webhook_signature_evaluator = WebhookSignatureEvaluator()
    gift_unlock_evaluator = GiftUnlockAccuracyEvaluator()
    firestore_integrity_evaluator = FirestoreDataIntegrityEvaluator()
    error_handling_evaluator = ErrorHandlingEvaluator()
    response_time_evaluator = ResponseTimeEvaluator(threshold_ms=3000)
    metadata_extraction_evaluator = MetadataExtractionEvaluator()
    
    # Get data file path
    data_file = Path(__file__).parent / "test_data.jsonl"
    output_path = Path(__file__).parent / "evaluation_results.json"
    
    print(f"Running evaluation with {6} evaluators...")
    print()
    
    # Run evaluation using evaluate() API
    result = evaluate(
        data=str(data_file),
        evaluators={
            "webhook_signature": webhook_signature_evaluator,
            "gift_unlock": gift_unlock_evaluator,
            "firestore_integrity": firestore_integrity_evaluator,
            "error_handling": error_handling_evaluator,
            "response_time": response_time_evaluator,
            "metadata_extraction": metadata_extraction_evaluator
        },
        evaluator_config={
            "webhook_signature": {
                "column_mapping": {
                    "webhook_payload": "${data.webhook_payload}",
                    "signature": "${data.signature}",
                    "secret": "${data.secret}",
                    "expected_valid": "${data.expected_valid}"
                }
            },
            "gift_unlock": {
                "column_mapping": {
                    "gift_id": "${data.gift_id}",
                    "user_id": "${data.user_id}",
                    "firestore_data": "${data.firestore_data}",
                    "expected_unlocked": "${data.expected_unlocked}"
                }
            },
            "firestore_integrity": {
                "column_mapping": {
                    "app_id": "${data.app_id}",
                    "user_id": "${data.user_id}",
                    "document_path": "${data.document_path}",
                    "data_structure": "${data.firestore_data}"
                }
            },
            "error_handling": {
                "column_mapping": {
                    "request_type": "${data.request_type}",
                    "response_status": "${data.response_status}",
                    "response_body": "${data.webhook_payload}",
                    "expected_status": "${data.expected_status}"
                }
            },
            "response_time": {
                "column_mapping": {
                    "processing_time_ms": "${data.processing_time_ms}"
                }
            },
            "metadata_extraction": {
                "column_mapping": {
                    "checkout_session": "${data.checkout_session}",
                    "extracted_gift_id": "${data.extracted_gift_id}",
                    "extracted_user_id": "${data.extracted_user_id}",
                    "extracted_app_id": "${data.extracted_app_id}"
                }
            }
        },
        output_path=str(output_path)
    )
    
    print("=" * 80)
    print("EVALUATION RESULTS")
    print("=" * 80)
    print()
    
    # Display aggregate metrics
    metrics = result.get("metrics", {})
    
    print("📊 AGGREGATE METRICS:")
    print("-" * 80)
    
    evaluator_names = [
        ("webhook_signature", "Webhook Signature Verification"),
        ("gift_unlock", "Gift Unlock Accuracy"),
        ("firestore_integrity", "Firestore Data Integrity"),
        ("error_handling", "Error Handling"),
        ("response_time", "Response Time"),
        ("metadata_extraction", "Metadata Extraction")
    ]
    
    for eval_key, eval_name in evaluator_names:
        score_key = f"{eval_key}.score"
        if score_key in metrics:
            score = metrics[score_key]
            print(f"  {eval_name:40s}: {score:.2%}")
    
    print()
    print("-" * 80)
    
    # Overall pass rate
    if "pass_rate" in metrics:
        print(f"\n🎯 Overall Pass Rate: {metrics['pass_rate']:.2%}")
    
    # Count test cases
    rows = result.get("rows", [])
    print(f"📝 Total Test Cases: {len(rows)}")
    print()
    
    print("=" * 80)
    print(f"✅ Evaluation complete! Detailed results saved to:")
    print(f"   {output_path}")
    print("=" * 80)
    print()
    
    # Display sample row-level results
    print("📋 SAMPLE TEST RESULTS:")
    print("-" * 80)
    
    for i, row in enumerate(rows[:3], 1):  # Show first 3 test cases
        test_name = row.get("test_name", f"Test {i}")
        print(f"\n{i}. {test_name}")
        
        # Show scores for each evaluator
        for eval_key, eval_name in evaluator_names:
            output_key = f"outputs.{eval_key}.score"
            reason_key = f"outputs.{eval_key}.reason"
            
            if output_key in row:
                score = row[output_key]
                reason = row.get(reason_key, "")
                status = "✅" if score >= 0.7 else "⚠️" if score >= 0.5 else "❌"
                print(f"   {status} {eval_name}: {score:.2%}")
                if reason:
                    print(f"      → {reason}")
    
    if len(rows) > 3:
        print(f"\n   ... and {len(rows) - 3} more test cases")
    
    print()
    print("-" * 80)
    print()
    
    # Recommendations based on results
    print("💡 RECOMMENDATIONS:")
    print("-" * 80)
    
    recommendations = []
    
    # Check each metric
    for eval_key, eval_name in evaluator_names:
        score_key = f"{eval_key}.score"
        if score_key in metrics:
            score = metrics[score_key]
            if score < 0.7:
                recommendations.append(f"• {eval_name} needs attention (score: {score:.2%})")
    
    if recommendations:
        for rec in recommendations:
            print(rec)
    else:
        print("• All metrics performing well! ✨")
    
    print()
    print("=" * 80)
    print()
    
    return result


if __name__ == "__main__":
    try:
        result = main()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
