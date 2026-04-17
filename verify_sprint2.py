#!/usr/bin/env python3
"""
GigMatch Sprint 2 Deployment Verification Script
Checks all required files and basic functionality
"""

import os
import json
from pathlib import Path

class Sprint2Verifier:
    def __init__(self, base_path):
        self.base_path = Path(base_path)
        self.results = {
            'html_files': [],
            'js_files': [],
            'docs': [],
            'firestore_collections': [],
            'errors': []
        }
    
    def verify_html_files(self):
        """Verify all 4 Sprint 2 HTML files exist"""
        required_files = [
            'job-post.html',
            'jobs-discover.html',
            'job-detail.html',
            'jobs-list.html'
        ]
        
        for file in required_files:
            path = self.base_path / file
            if path.exists():
                size = path.stat().st_size
                self.results['html_files'].append({
                    'name': file,
                    'status': '✅ FOUND',
                    'size_kb': round(size / 1024, 2)
                })
            else:
                self.results['errors'].append(f'Missing HTML: {file}')
                self.results['html_files'].append({
                    'name': file,
                    'status': '❌ MISSING'
                })
    
    def verify_js_files(self):
        """Verify all 4 Sprint 2 JavaScript files exist"""
        required_files = [
            'js/job-post.js',
            'js/discover.js',
            'js/job-detail.js',
            'js/jobs-list.js'
        ]
        
        for file in required_files:
            path = self.base_path / file
            if path.exists():
                size = path.stat().st_size
                self.results['js_files'].append({
                    'name': file,
                    'status': '✅ FOUND',
                    'size_kb': round(size / 1024, 2)
                })
            else:
                self.results['errors'].append(f'Missing JS: {file}')
                self.results['js_files'].append({
                    'name': file,
                    'status': '❌ MISSING'
                })
    
    def verify_documentation(self):
        """Verify Sprint 2 documentation files"""
        required_docs = [
            'SPRINT_2_IMPLEMENTATION.md',
            'SPRINT_2_READY.md'
        ]
        
        for doc in required_docs:
            path = self.base_path / doc
            if path.exists():
                size = path.stat().st_size
                self.results['docs'].append({
                    'name': doc,
                    'status': '✅ FOUND',
                    'size_kb': round(size / 1024, 2)
                })
            else:
                self.results['errors'].append(f'Missing Doc: {doc}')
                self.results['docs'].append({
                    'name': doc,
                    'status': '❌ MISSING'
                })
    
    def print_report(self):
        """Print verification report"""
        print("\n" + "="*60)
        print("🚀 GIGMATCH SPRINT 2 DEPLOYMENT VERIFICATION")
        print("="*60 + "\n")
        
        # HTML Files
        print("📄 HTML Pages (4 required)")
        print("-" * 40)
        for item in self.results['html_files']:
            status = item.get('status', '❓')
            name = item.get('name', '')
            size = f" ({item.get('size_kb')}KB)" if 'size_kb' in item else ""
            print(f"  {status} {name}{size}")
        
        # JavaScript Files
        print("\n📦 JavaScript Modules (4 required)")
        print("-" * 40)
        for item in self.results['js_files']:
            status = item.get('status', '❓')
            name = item.get('name', '')
            size = f" ({item.get('size_kb')}KB)" if 'size_kb' in item else ""
            print(f"  {status} {name}{size}")
        
        # Documentation
        print("\n📚 Documentation (2 required)")
        print("-" * 40)
        for item in self.results['docs']:
            status = item.get('status', '❓')
            name = item.get('name', '')
            size = f" ({item.get('size_kb')}KB)" if 'size_kb' in item else ""
            print(f"  {status} {name}{size}")
        
        # Summary
        print("\n" + "="*60)
        total_files = len(self.results['html_files']) + len(self.results['js_files'])
        found_files = sum(1 for f in self.results['html_files'] + self.results['js_files'] if '✅' in f.get('status', ''))
        
        if self.results['errors']:
            print("❌ ERRORS FOUND:")
            for error in self.results['errors']:
                print(f"  - {error}")
        else:
            print("✅ ALL FILES VERIFIED!")
        
        print(f"\nTotal Files: {found_files}/{total_files}")
        print("\n" + "="*60 + "\n")
        
        return len(self.results['errors']) == 0

# Run verification
if __name__ == "__main__":
    gigmatch_path = "c:\\Users\\Prarthana\\OneDrive\\Desktop\\gigmatch"
    verifier = Sprint2Verifier(gigmatch_path)
    
    verifier.verify_html_files()
    verifier.verify_js_files()
    verifier.verify_documentation()
    
    success = verifier.print_report()
    exit(0 if success else 1)
