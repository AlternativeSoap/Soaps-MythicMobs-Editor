/**
 * Admin Panel Diagnostic Script
 * Copy and paste this entire script into your browser console to test all admin panel features
 */

(async function adminPanelDiagnostic() {
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // Test 1: Check Supabase Connection
    console.log('1️⃣ Testing Supabase Connection...');
    if (window.supabaseClient) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                results.passed.push('✅ Supabase connected and authenticated');
                console.log(`   User ID: ${user.id}`);
            } else {
                results.warnings.push('⚠️ Supabase connected but not authenticated');
            }
        } catch (e) {
            results.failed.push(`❌ Supabase auth error: ${e.message}`);
        }
    } else {
        results.failed.push('❌ window.supabaseClient not found');
    }
    
    // Test 2: Check Error Logger
    console.log('\n2️⃣ Testing Error Logger...');
    if (window.errorLogger) {
        results.passed.push('✅ ErrorLogger initialized');
        console.log(`   Errors logged: ${window.errorLogger.errors.length}`);
        
        // Test logging
        window.errorLogger.logError({
            type: 'runtime',
            message: 'Diagnostic test error',
            source: 'diagnostic.js',
            line: 1,
            column: 1
        });
        
        if (window.errorLogger.errors.some(e => e.message === 'Diagnostic test error')) {
            results.passed.push('✅ Error logging works');
        } else {
            results.failed.push('❌ Error logging failed');
        }
    } else {
        results.failed.push('❌ window.errorLogger not found');
    }
    
    // Test 3: Check Permission System
    console.log('\n3️⃣ Testing Permission System...');
    if (window.permissionSystem) {
        results.passed.push('✅ PermissionSystem initialized');
        const permCount = Object.keys(window.permissionSystem.PERMISSIONS).length;
        const roleCount = Object.keys(window.permissionSystem.DEFAULT_ROLES).length;
        console.log(`   Permissions: ${permCount}, Roles: ${roleCount}`);
        
        if (permCount > 15 && roleCount === 4) {
            results.passed.push('✅ Permission system fully configured');
        } else {
            results.warnings.push(`⚠️ Permission system may be incomplete (${permCount} perms, ${roleCount} roles)`);
        }
    } else {
        results.failed.push('❌ window.permissionSystem not found');
    }
    
    // Test 4: Check User Profile Manager
    console.log('\n4️⃣ Testing User Profile Manager...');
    if (window.userProfileManager) {
        results.passed.push('✅ UserProfileManager initialized');
        
        try {
            const profile = await window.userProfileManager.loadProfile();
            if (profile) {
                results.passed.push('✅ Profile loading works');
                console.log(`   Display Name: ${profile.display_name || 'Not set'}`);
            }
        } catch (e) {
            results.warnings.push(`⚠️ Profile loading error: ${e.message}`);
        }
    } else {
        results.failed.push('❌ window.userProfileManager not found');
    }
    
    // Test 5: Check Admin Panel Enhanced
    console.log('\n5️⃣ Testing Admin Panel Enhanced...');
    if (window.adminPanelEnhanced) {
        results.passed.push('✅ AdminPanelEnhanced initialized');
    } else {
        results.failed.push('❌ window.adminPanelEnhanced not found');
    }
    
    // Test 6: Check Database Tables
    console.log('\n6️⃣ Testing Database Access...');
    if (window.supabaseClient) {
        const tables = [
            { name: 'user_roles', critical: true },
            { name: 'admin_roles', critical: true },
            { name: 'user_profiles', critical: true },
            { name: 'error_logs', critical: false },
            { name: 'user_data', critical: true }
        ];
        
        for (const table of tables) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(table.name)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    if (error.message.includes('infinite recursion') || error.code === '54001') {
                        results.failed.push(`❌ ${table.name}: Infinite recursion/stack depth (RLS policy needs fix)`);
                    } else if (error.code === '42P01') {
                        if (table.critical) {
                            results.failed.push(`❌ ${table.name}: Table does not exist (CRITICAL)`);
                        } else {
                            results.warnings.push(`⚠️ ${table.name}: Table does not exist`);
                        }
                    } else {
                        results.warnings.push(`⚠️ ${table.name}: ${error.message}`);
                    }
                } else {
                    results.passed.push(`✅ ${table.name} table accessible`);
                }
            } catch (e) {
                results.warnings.push(`⚠️ ${table.name}: ${e.message}`);
            }
        }
        
        // Test user_data unique constraint
        try {
            const { error } = await window.supabaseClient
                .from('user_data')
                .upsert({
                    user_id: (await window.supabaseClient.auth.getUser()).data.user?.id,
                    key: 'diagnostic_test',
                    value: { test: true }
                }, {
                    onConflict: 'user_id,key'
                });
            
            if (error && error.code === '42P10') {
                results.failed.push(`❌ user_data: Missing unique constraint on (user_id, key)`);
            } else if (!error) {
                results.passed.push(`✅ user_data unique constraint works`);
            }
        } catch (e) {
            // Ignore this test error
        }
    }
    
    // Test 7: Check Admin Panel Tabs
    console.log('\n7️⃣ Testing Admin Panel Tabs...');
    const expectedTabs = ['templates', 'browsers', 'users', 'activity', 'errors', 'permissions', 'analytics', 'settings'];
    const tabs = document.querySelectorAll('.admin-tab');
    const tabNames = Array.from(tabs).map(tab => tab.dataset.tab);
    
    console.log(`   Found ${tabs.length} tabs: ${tabNames.join(', ')}`);
    
    for (const expectedTab of expectedTabs) {
        if (tabNames.includes(expectedTab)) {
            results.passed.push(`✅ ${expectedTab} tab exists`);
        } else {
            results.warnings.push(`⚠️ ${expectedTab} tab missing (may require admin panel to be open)`);
        }
    }
    
    // Test 8: Check Tab Content
    console.log('\n8️⃣ Testing Tab Content...');
    const newTabs = ['errors', 'permissions', 'analytics', 'settings'];
    const tabContents = document.querySelectorAll('.admin-tab-content');
    const contentNames = Array.from(tabContents).map(content => content.dataset.tabContent);
    
    for (const newTab of newTabs) {
        if (contentNames.includes(newTab)) {
            results.passed.push(`✅ ${newTab} content exists`);
        } else {
            results.warnings.push(`⚠️ ${newTab} content missing (may require admin panel to be open)`);
        }
    }
    
    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('='.repeat(60));
    
    if (results.passed.length > 0) {
        console.log('\n✅ PASSED (' + results.passed.length + ')');
        results.passed.forEach(msg => console.log('   ' + msg));
    }
    
    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS (' + results.warnings.length + ')');
        results.warnings.forEach(msg => console.log('   ' + msg));
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ FAILED (' + results.failed.length + ')');
        results.failed.forEach(msg => console.log('   ' + msg));
    }
    
    // Overall Status
    console.log('\n' + '='.repeat(60));
    if (results.failed.length === 0) {
        console.log('Admin panel should work correctly.');
    } else if (results.failed.length < 3) {
        console.log('⚠️  PARTIALLY OPERATIONAL');
        console.log('Some features may not work. Check failed items above.');
    } else {
        console.log('❌ CRITICAL ISSUES DETECTED');
        console.log('Admin panel may not work. Fix failed items above.');
    }
    console.log('='.repeat(60));
    
    // Suggestions
    if (results.failed.some(msg => msg.includes('infinite recursion') || msg.includes('stack depth'))) {
        console.log('\n💡 FIX: Run FIX_DATABASE_ERRORS.sql in Supabase SQL Editor');
    }
    if (results.failed.some(msg => msg.includes('unique constraint'))) {
        console.log('\n💡 FIX: Run FIX_DATABASE_ERRORS.sql to add missing constraint');
    }
    if (results.failed.some(msg => msg.includes('not found'))) {
        console.log('\n💡 FIX: Refresh page (Ctrl+F5) to reload all scripts');
    }
    if (results.warnings.some(msg => msg.includes('Table does not exist'))) {
        console.log('\n💡 FIX: Run ADMIN_PANEL_DATABASE_SCHEMA.sql in Supabase SQL Editor');
    }
    
    return {
        passed: results.passed.length,
        warnings: results.warnings.length,
        failed: results.failed.length,
        status: results.failed.length === 0 ? 'OPERATIONAL' : 'ISSUES'
    };
})();
