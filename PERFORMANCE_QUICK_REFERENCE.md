# Performance Optimization - Quick Reference

## 🚀 For Users

### What Changed?
- Modals now close properly instead of stacking
- Faster browser opening
- Less memory usage
- Smoother performance

### New Features
You can now monitor performance in real-time:

```javascript
// Open browser console (F12) and type:
enablePerfMonitor()   // Start monitoring
perfReport()          // View performance report
disablePerfMonitor()  // Stop monitoring
```

---

## 👨‍💻 For Developers

### Browser Singleton Manager

**Get browsers the new way:**
```javascript
// Instead of creating new instances:
const mechanic = new MechanicBrowser(...);  // ❌ Old way

// Use the singleton manager:
const mechanic = window.browserManager.getMechanicBrowser();  // ✅ New way
```

**Available Methods:**
```javascript
browserManager.getMechanicBrowser()
browserManager.getTargeterBrowser()
browserManager.getConditionBrowser()
browserManager.getTriggerBrowser()
browserManager.getSkillBrowser()

// Management
browserManager.destroyBrowser('mechanic')  // Destroy specific browser
browserManager.destroyAll()                // Destroy all browsers
browserManager.logStatus()                 // Check status
```

### Performance Monitor

**Track performance:**
```javascript
// Enable monitoring
window.performanceMonitor.setEnabled(true)

// Get current metrics
const metrics = window.performanceMonitor.getMetrics()
console.log(metrics)
// {
//   domNodes: 1234,
//   eventListeners: 89,
//   modalsOpen: 2,
//   memoryUsage: {...}
// }

// Get detailed report
const report = window.performanceMonitor.getReport()
console.table(report)

// Register/unregister modals
window.performanceMonitor.registerModal('myModal', instance)
window.performanceMonitor.unregisterModal('myModal')

// Track listeners
window.performanceMonitor.trackListener(element, 'click', handler)
window.performanceMonitor.untrackListener(element, 'click', handler)
```

### Modal Best Practices

**✅ DO:**
```javascript
class MyModal {
    close() {
        this.cleanup();  // Clear caches, listeners
        this.overlay.style.display = 'none';
    }
    
    destroy() {
        this.cleanup();
        this.overlay.remove();  // Remove from DOM
    }
    
    cleanup() {
        // Clear caches
        if (this.cache) this.cache.clear();
        
        // Remove listeners
        this.listeners.forEach(({el, ev, fn}) => {
            el.removeEventListener(ev, fn);
        });
        this.listeners = [];
    }
}
```

**❌ DON'T:**
```javascript
class MyModal {
    close() {
        this.overlay.style.display = 'none';  // Just hiding
        // ❌ Leaves listeners active
        // ❌ Caches still in memory
        // ❌ DOM still in page
    }
}
```

### Adding Cleanup to Components

**Template:**
```javascript
class MyComponent {
    constructor() {
        this.cache = new Map();
        this.listeners = [];
    }
    
    // Track listeners for cleanup
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }
    
    // Cleanup method
    cleanup() {
        // Clear caches
        if (this.cache) {
            this.cache.clear();
        }
        
        // Remove listeners
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
        
        // Clear other resources
        if (this.virtualScroller) {
            this.virtualScroller = null;
        }
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    
    // Destroy method
    destroy() {
        this.cleanup();
        const element = document.getElementById('myElement');
        if (element) {
            element.remove();
        }
    }
}
```

---

## 🔍 Debugging Performance Issues

### Check Modal Stack
```javascript
// See all open modals
window.performanceMonitor.getMetrics().modals
// ['mechanicBrowser', 'skillLineBuilder']

// Browser manager status
window.browserManager.logStatus()
```

### Check Memory Usage
```javascript
// Take snapshot
const snapshot = window.performanceMonitor.sample()
console.log(snapshot)

// Check trend over time
const report = window.performanceMonitor.getReport()
console.log('Peak DOM nodes:', report.peaks.domNodes)
console.log('Avg DOM nodes:', report.averages.domNodes)
```

### Check for Leaks
```javascript
// Enable monitoring
enablePerfMonitor()

// Perform actions (open/close modals 10 times)

// Check report
const report = perfReport()

// If DOM nodes or listeners keep increasing,
// you have a leak!
```

---

## 📋 Checklist: Creating New Modals

When creating a new modal component:

- [ ] Add `cleanup()` method
- [ ] Add `destroy()` method
- [ ] Track all event listeners
- [ ] Clear all caches in cleanup
- [ ] Remove DOM elements in destroy
- [ ] Disconnect observers
- [ ] Destroy virtual scrollers
- [ ] Test with performance monitor
- [ ] Register with browserManager if reusable

---

## 🐛 Common Issues & Fixes

### Issue: Modal doesn't close properly
**Solution:**
```javascript
// Make sure close() removes display completely
close() {
    this.overlay.style.display = 'none';  // ✅
    // NOT: this.overlay.classList.add('hidden');  // ❌
}
```

### Issue: Memory keeps growing
**Solution:**
```javascript
// Add cleanup to your close method
close() {
    this.cleanup();  // ✅ Clear resources
    this.overlay.style.display = 'none';
}
```

### Issue: Browser opens slowly
**Solution:**
```javascript
// Use singleton instead of creating new instance
// ❌ Slow:
const browser = new MechanicBrowser(...);

// ✅ Fast:
const browser = window.browserManager.getMechanicBrowser();
```

### Issue: Multiple browser instances
**Solution:**
```javascript
// Always use singleton manager
const browser = window.browserManager.getMechanicBrowser();

// Check instances
window.browserManager.logStatus();
// Should only show 1 instance of each type
```

---

## 🎯 Performance Targets

### Good Performance:
- DOM nodes: < 2,000
- Event listeners: < 100
- Modals open: ≤ 2
- Memory: < 50 MB

### Warning Signs:
- DOM nodes: > 3,000
- Event listeners: > 150
- Modals open: > 3
- Memory: > 80 MB

### Critical:
- DOM nodes: > 5,000
- Event listeners: > 200
- Modals open: > 4
- Memory: > 100 MB

---

## 💡 Tips & Tricks

1. **Warm the cache early:**
   ```javascript
   // In app initialization
   window.browserManager.initializeAll();
   ```

2. **Monitor during development:**
   ```javascript
   // Add to your dev tools
   if (DEBUG_MODE) {
       window.enablePerfMonitor();
   }
   ```

3. **Use requestIdleCallback for cleanup:**
   ```javascript
   requestIdleCallback(() => {
       this.cleanup();
   });
   ```

4. **Batch DOM operations:**
   ```javascript
   // Use DocumentFragment
   const fragment = document.createDocumentFragment();
   items.forEach(item => fragment.appendChild(item));
   container.appendChild(fragment);  // Single reflow
   ```

5. **Clear caches periodically:**
   ```javascript
   setInterval(() => {
       if (this.cache.size > 1000) {
           this.cache.clear();
       }
   }, 60000);  // Every minute
   ```

---

## 📚 Related Documentation

- [PERFORMANCE_OPTIMIZATION_COMPLETE.md](./PERFORMANCE_OPTIMIZATION_COMPLETE.md) - Full implementation details
- `utils/performanceMonitor.js` - Performance monitoring utility
- `utils/browserSingletonManager.js` - Browser singleton manager

---

**Questions?** Check the console: `window.browserManager` and `window.performanceMonitor` are available globally for debugging.
