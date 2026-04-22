"""
Custom Evaluators for AI Enterprise Studio
Evaluates Stripe webhook integration, Firebase operations, and app functionality
"""

import json
import time
from typing import Dict, Any, Optional


class WebhookSignatureEvaluator:
    """
    Evaluates Stripe webhook signature verification correctness
    """
    
    def __init__(self):
        self.description = "Validates Stripe webhook signature verification"
    
    def __call__(self, *, webhook_payload: str, signature: str, secret: str, expected_valid: bool, **kwargs) -> Dict[str, Any]:
        """
        Evaluate webhook signature verification
        
        Args:
            webhook_payload: The webhook payload body
            signature: The Stripe signature header
            secret: The webhook signing secret
            expected_valid: Whether signature should be valid
        
        Returns:
            Dictionary with score and reasoning
        """
        import hmac
        import hashlib
        
        try:
            # Extract timestamp and signatures from header
            elements = signature.split(',')
            timestamp = None
            signatures = []
            
            for element in elements:
                if element.startswith('t='):
                    timestamp = element[2:]
                elif element.startswith('v1='):
                    signatures.append(element[3:])
            
            if not timestamp or not signatures:
                return {
                    "signature_valid": False,
                    "score": 0.0 if expected_valid else 1.0,
                    "reason": "Missing timestamp or signature in header"
                }
            
            # Compute expected signature
            signed_payload = f"{timestamp}.{webhook_payload}"
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Check if any signature matches
            is_valid = any(hmac.compare_digest(expected_sig, sig) for sig in signatures)
            
            # Score based on whether validation matches expectation
            score = 1.0 if (is_valid == expected_valid) else 0.0
            
            return {
                "signature_valid": is_valid,
                "computed_signature": expected_sig,
                "signed_payload": signed_payload,
                "score": score,
                "reason": f"Signature validation {'correct' if score == 1.0 else 'incorrect'}: expected {expected_valid}, got {is_valid}"
            }
            
        except Exception as e:
            return {
                "signature_valid": False,
                "computed_signature": None,
                "signed_payload": None,
                "score": 0.0,
                "reason": f"Signature verification error: {str(e)}"
            }


class GiftUnlockAccuracyEvaluator:
    """
    Evaluates whether gifts are correctly unlocked in Firestore after payment
    """
    
    def __init__(self):
        self.description = "Validates gift unlock accuracy in Firestore"
    
    def __call__(self, *, gift_id: str, user_id: str, firestore_data: Dict[str, Any], 
                 expected_unlocked: bool, **kwargs) -> Dict[str, Any]:
        """
        Evaluate gift unlock accuracy
        
        Args:
            gift_id: The gift ID to check
            user_id: The user ID
            firestore_data: Firestore document data
            expected_unlocked: Expected unlock status
        
        Returns:
            Dictionary with score and reasoning
        """
        try:
            # Check if gift is unlocked in Firestore data
            is_unlocked = firestore_data.get(gift_id, False) if firestore_data else False
            
            # Score based on whether status matches expectation
            score = 1.0 if (is_unlocked == expected_unlocked) else 0.0
            
            return {
                "gift_unlocked": is_unlocked,
                "score": score,
                "reason": f"Gift '{gift_id}' for user '{user_id}': expected {expected_unlocked}, got {is_unlocked}"
            }
            
        except Exception as e:
            return {
                "gift_unlocked": False,
                "score": 0.0,
                "reason": f"Gift unlock check error: {str(e)}"
            }


class FirestoreDataIntegrityEvaluator:
    """
    Evaluates Firestore document path and data structure correctness
    """
    
    def __init__(self):
        self.description = "Validates Firestore document paths and data structure"
    
    def __call__(self, *, app_id: str, user_id: str, document_path: str, 
                 data_structure: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Evaluate Firestore data integrity
        
        Args:
            app_id: Application ID
            user_id: User ID
            document_path: Actual document path used
            data_structure: Actual data structure
        
        Returns:
            Dictionary with score and reasoning
        """
        try:
            # Expected path pattern
            expected_path = f"artifacts/{app_id}/users/{user_id}/gifts/unlocked"
            
            # Check path correctness
            path_correct = document_path == expected_path
            
            # Check data structure (should be flat dict with gift IDs as keys)
            structure_valid = isinstance(data_structure, dict)
            if structure_valid:
                # All values should be boolean
                structure_valid = all(isinstance(v, bool) for v in data_structure.values())
            
            # Calculate score
            path_score = 1.0 if path_correct else 0.0
            structure_score = 1.0 if structure_valid else 0.0
            overall_score = (path_score + structure_score) / 2.0
            
            issues = []
            if not path_correct:
                issues.append(f"Path mismatch: expected '{expected_path}', got '{document_path}'")
            if not structure_valid:
                issues.append("Invalid data structure: expected flat dict with boolean values")
            
            return {
                "path_correct": path_correct,
                "structure_valid": structure_valid,
                "score": overall_score,
                "reason": "; ".join(issues) if issues else "Document path and structure correct"
            }
            
        except Exception as e:
            return {
                "path_correct": False,
                "structure_valid": False,
                "score": 0.0,
                "reason": f"Data integrity check error: {str(e)}"
            }


class ErrorHandlingEvaluator:
    """
    Evaluates proper error responses for invalid webhook requests
    """
    
    def __init__(self):
        self.description = "Validates error handling for invalid requests"
    
    def __call__(self, *, request_type: str, response_status: int, response_body: str,
                 expected_status: int, **kwargs) -> Dict[str, Any]:
        """
        Evaluate error handling
        
        Args:
            request_type: Type of request (e.g., "missing_signature", "invalid_signature")
            response_status: HTTP status code returned
            response_body: Response body
            expected_status: Expected status code
        
        Returns:
            Dictionary with score and reasoning
        """
        try:
            # Check status code
            status_correct = response_status == expected_status
            
            # Check if response contains error information
            has_error_info = False
            try:
                body_data = json.loads(response_body)
                has_error_info = "error" in body_data or "message" in body_data
            except:
                has_error_info = len(response_body) > 0
            
            # Calculate score
            status_score = 1.0 if status_correct else 0.0
            error_info_score = 1.0 if has_error_info else 0.5  # Less critical
            overall_score = (status_score * 0.7) + (error_info_score * 0.3)
            
            return {
                "status_correct": status_correct,
                "has_error_info": has_error_info,
                "score": overall_score,
                "reason": f"Request '{request_type}': expected status {expected_status}, got {response_status}; error info {'present' if has_error_info else 'missing'}"
            }
            
        except Exception as e:
            return {
                "status_correct": False,
                "has_error_info": False,
                "score": 0.0,
                "reason": f"Error handling check failed: {str(e)}"
            }


class ResponseTimeEvaluator:
    """
    Evaluates webhook processing latency
    """
    
    def __init__(self, threshold_ms: float = 3000):
        """
        Args:
            threshold_ms: Maximum acceptable response time in milliseconds
        """
        self.threshold_ms = threshold_ms
        self.description = f"Validates webhook response time (threshold: {threshold_ms}ms)"
    
    def __call__(self, *, processing_time_ms: float, **kwargs) -> Dict[str, Any]:
        """
        Evaluate response time
        
        Args:
            processing_time_ms: Time taken to process webhook in milliseconds
        
        Returns:
            Dictionary with score and reasoning
        """
        try:
            # Score decreases linearly as time approaches threshold
            if processing_time_ms <= self.threshold_ms:
                # Linear scoring: 1.0 at 0ms, decreasing to 0.5 at threshold
                score = 1.0 - (processing_time_ms / self.threshold_ms * 0.5)
            else:
                # Below threshold: score decreases more rapidly
                score = max(0.0, 0.5 - ((processing_time_ms - self.threshold_ms) / self.threshold_ms * 0.5))
            
            performance_level = "excellent" if score >= 0.9 else "good" if score >= 0.7 else "acceptable" if score >= 0.5 else "poor"
            
            return {
                "processing_time_ms": processing_time_ms,
                "within_threshold": processing_time_ms <= self.threshold_ms,
                "score": score,
                "reason": f"Response time: {processing_time_ms:.2f}ms ({performance_level})"
            }
            
        except Exception as e:
            return {
                "processing_time_ms": -1,
                "within_threshold": False,
                "score": 0.0,
                "reason": f"Response time check error: {str(e)}"
            }


class MetadataExtractionEvaluator:
    """
    Evaluates correct extraction of metadata from Stripe checkout session
    """
    
    def __init__(self):
        self.description = "Validates metadata extraction from checkout session"
    
    def __call__(self, *, checkout_session: Dict[str, Any], extracted_gift_id: str,
                 extracted_user_id: str, extracted_app_id: str, **kwargs) -> Dict[str, Any]:
        """
        Evaluate metadata extraction
        
        Args:
            checkout_session: The checkout session object
            extracted_gift_id: Extracted gift ID
            extracted_user_id: Extracted user ID
            extracted_app_id: Extracted app ID
        
        Returns:
            Dictionary with score and reasoning
        """
        try:
            # Get expected values from checkout session metadata
            metadata = checkout_session.get("metadata", {})
            expected_gift_id = metadata.get("giftId", "")
            expected_user_id = metadata.get("userId", "")
            expected_app_id = metadata.get("appId", "")
            
            # Check each field
            gift_id_correct = extracted_gift_id == expected_gift_id
            user_id_correct = extracted_user_id == expected_user_id
            app_id_correct = extracted_app_id == expected_app_id
            
            # Calculate score (all fields must be correct)
            correct_fields = sum([gift_id_correct, user_id_correct, app_id_correct])
            score = correct_fields / 3.0
            
            issues = []
            if not gift_id_correct:
                issues.append(f"giftId: expected '{expected_gift_id}', got '{extracted_gift_id}'")
            if not user_id_correct:
                issues.append(f"userId: expected '{expected_user_id}', got '{extracted_user_id}'")
            if not app_id_correct:
                issues.append(f"appId: expected '{expected_app_id}', got '{extracted_app_id}'")
            
            return {
                "gift_id_correct": gift_id_correct,
                "user_id_correct": user_id_correct,
                "app_id_correct": app_id_correct,
                "score": score,
                "reason": "; ".join(issues) if issues else "All metadata fields extracted correctly"
            }
            
        except Exception as e:
            return {
                "gift_id_correct": False,
                "user_id_correct": False,
                "app_id_correct": False,
                "score": 0.0,
                "reason": f"Metadata extraction check error: {str(e)}"
            }
