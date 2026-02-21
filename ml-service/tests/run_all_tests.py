#!/usr/bin/env python3
"""
Phase 3: Complete Test Runner
Runs all unit tests, API tests, and generates report
"""

import sys
import os
import json
import time
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.test_model import run_all_tests as run_model_tests
from tests.test_api import run_api_tests


class TestReport:
    """Generate comprehensive test report"""
    
    def __init__(self):
        self.report = {
            'timestamp': datetime.now().isoformat(),
            'phases': {}
        }
    
    def add_phase_result(self, phase_name, success, details=None):
        """Add phase result to report"""
        self.report['phases'][phase_name] = {
            'success': success,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
    
    def save_report(self, filepath='tests/test_results.json'):
        """Save report to file"""
        with open(filepath, 'w') as f:
            json.dump(self.report, f, indent=2)
        
        print(f"\n📄 Report saved to: {filepath}")
    
    def print_summary(self):
        """Print summary report"""
        print("\n" + "="*60)
        print("📊 FINAL TEST SUMMARY")
        print("="*60)
        
        total_phases = len(self.report['phases'])
        passed_phases = sum(1 for p in self.report['phases'].values() if p['success'])
        
        print(f"\nPhases Tested: {total_phases}")
        print(f"Passed: {passed_phases}")
        print(f"Failed: {total_phases - passed_phases}")
        
        print("\nPhase Results:")
        for phase, result in self.report['phases'].items():
            status = "✅" if result['success'] else "❌"
            print(f"  {status} {phase}")
        
        if passed_phases == total_phases:
            print("\n" + "="*60)
            print("✅ ALL TESTS PASSED!")
            print("="*60)
            return True
        else:
            print("\n" + "="*60)
            print("❌ SOME TESTS FAILED")
            print("="*60)
            return False


def run_phase_3_tests():
    """Run complete Phase 3 test suite"""
    
    print("\n" + "="*70)
    print("🚀 PHASE 3: COMPREHENSIVE ML SERVICE TESTING")
    print("="*70)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    report = TestReport()
    
    # Phase 3.1: Unit Tests
    print("\n" + "="*70)
    print("PHASE 3.1: UNIT TESTS (Model, Data, Metrics)")
    print("="*70)
    
    try:
        start_time = time.time()
        model_tests_passed = run_model_tests()
        elapsed = time.time() - start_time
        
        report.add_phase_result('Unit Tests', model_tests_passed, {
            'elapsed_time': f"{elapsed:.2f}s"
        })
    except Exception as e:
        print(f"\n❌ Unit Tests Error: {e}")
        report.add_phase_result('Unit Tests', False, {'error': str(e)})
        model_tests_passed = False
    
    # Phase 3.2: API Integration Tests
    print("\n" + "="*70)
    print("PHASE 3.2: API INTEGRATION TESTS")
    print("="*70)
    
    try:
        start_time = time.time()
        api_tests_passed = run_api_tests()
        elapsed = time.time() - start_time
        
        report.add_phase_result('API Tests', api_tests_passed, {
            'elapsed_time': f"{elapsed:.2f}s"
        })
    except Exception as e:
        print(f"\n❌ API Tests Error: {e}")
        report.add_phase_result('API Tests', False, {'error': str(e)})
        api_tests_passed = False
    
    # Save and print report
    report.save_report()
    overall_success = report.print_summary()
    
    print(f"\nEnd Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    return overall_success


if __name__ == '__main__':
    success = run_phase_3_tests()
    
    print("\n" + "="*70)
    if success:
        print("✅ PHASE 3 COMPLETE: ALL TESTS PASSED!")
        print("\nNext Steps:")
        print("  1. Deploy model to production")
        print("  2. Set up model monitoring")
        print("  3. Implement automated retraining")
        print("  4. Monitor prediction accuracy")
    else:
        print("❌ PHASE 3: SOME TESTS FAILED")
        print("\nPlease review test results and fix issues")
    print("="*70)
    
    sys.exit(0 if success else 1)
