/**
 * ModalKeyboardNav - Global keyboard navigation for all modals, overlays, and dialogs.
 *
 * Rules:
 *   ESC   → closes the topmost visible modal/overlay/dialog
 *   ENTER → triggers the primary action button ("Next", "Save", "Confirm", etc.)
 *           inside the topmost modal, when no text input is currently focused.
 *
 * Runs in the CAPTURE phase so it intercepts events before bubble-phase
 * handlers (e.g., the dashboard-navigation ESC in app.js).  When a modal
 * is actually handled, propagation is stopped so those handlers are skipped.
 *
 * Exports:
 *   window.isAnyModalOpen() — returns true when at least one modal is visible.
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────── helpers ──

    /**
     * True when the user is actively typing in a text control.
     * In that context we never hijack ENTER.
     */
    function isTypingInInput() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    /**
     * Find the "cancel / close / dismiss" button within a container.
     * Searches in priority order:
     *   1. Known IDs for mob/skill/close dialogs
     *   2. Explicit [data-action="cancel"] or [data-action="close"]
     *   3. Buttons whose visible text matches common cancel patterns
     *   4. .btn-secondary inside the footer
     *   5. Any .modal-close / .icon-btn[aria-label*="lose"]
     */
    function findCancelButton(container) {
        // Named close IDs
        const byId = container.querySelector(
            '#close-mob-dialog, #close-skill-dialog, #close-modal, ' +
            '#close-history-modal, #close-settings-modal, #close-mode-comparison, ' +
            '#auth-modal-close'
        );
        if (byId) return byId;

        // Explicit data-action
        const byAction = container.querySelector('[data-action="cancel"], [data-action="close"]');
        if (byAction) return byAction;

        // Text-based heuristic (buttons whose cleaned text matches cancel patterns)
        const CANCEL_RE = /^(cancel|close|dismiss|no|no thanks|skip|decline|back|abort|go back)$/i;
        const textMatch = Array.from(container.querySelectorAll('button')).find(btn => {
            const text = btn.textContent.replace(/\s+/g, ' ').trim();
            return CANCEL_RE.test(text);
        });
        if (textMatch) return textMatch;

        // Secondary button in footer
        const footerSecondary = container.querySelector(
            '.modal-footer .btn-secondary, .autosave-suggestion-footer .btn-secondary, ' +
            '.modal-footer .btn-outline, .notification-modal-footer .notification-modal-btn.secondary'
        );
        if (footerSecondary) return footerSecondary;

        // Generic close decorators
        return container.querySelector('.modal-close, .icon-btn[aria-label*="lose"]') || null;
    }

    /**
     * Find the primary action button within a container.
     * Looks for "Continue / Next / Save / Confirm / OK / Accept / Enable" buttons.
     */
    function findPrimaryButton(container) {
        // Explicit primary IDs
        const byId = container.querySelector(
            '#save-settings-btn, #confirm-mob-dialog, #confirm-skill-dialog, ' +
            '#enable-autosave-btn, #wizard-create, #wizard-next'
        );
        if (byId && !byId.disabled) return byId;

        // data-action="confirm" / "ok"
        const byAction = container.querySelector('[data-action="confirm"], [data-action="ok"]');
        if (byAction && !byAction.disabled) return byAction;

        // Text-based heuristic
        const PRIMARY_RE = /^(ok|save|confirm|continue|next|accept|enable|apply|create|finish|done|submit|proceed|forward|yes)$/i;
        const textMatch = Array.from(container.querySelectorAll('button:not([disabled])')).find(btn => {
            const text = btn.textContent.replace(/\s+/g, ' ').trim();
            return PRIMARY_RE.test(text);
        });
        if (textMatch) return textMatch;

        // .btn-primary in footer
        const footerPrimary = container.querySelector(
            '.modal-footer .btn-primary:not([disabled]), ' +
            '.autosave-suggestion-footer .btn-success:not([disabled]), ' +
            '.notification-modal-footer .notification-modal-btn.primary:not([disabled]), ' +
            '.legal-modal-footer .btn-primary:not([disabled])'
        );
        return footerPrimary || null;
    }

    // ─────────────────────────────────────────────────────────── modal finder ──

    /**
     * Finds the topmost visible modal/overlay and returns a descriptor:
     *   { close()      — closes the modal
     *     primaryBtn() — returns the primary action button, or null }
     *
     * Returns null when nothing is open.
     *
     * Priority order (highest → lowest):
     *  1. notification-modal-overlay  (alert / confirm dialogs)
     *  2. admin panel overlay         (#adminPanelOverlay)
     *  3. guided wizard               (#guided-wizard-overlay)
     *  4. creation mode selector      (#creationModeSelectorOverlay  .active)
     *  5. auth modal                  (#authModal  :not(.hidden))
     *  6. modal-container modals      (#modal-container  via createModal())
     *  7. dynamic inline overlays     (conflict, diff, mob/skill creation, autosave, etc.)
     *  8. legal modals                (.legal-modal-overlay :not(.hidden))
     *  9. static modals               (.modal :not(.hidden))
     * 10. onboarding tour             (.onboarding-overlay)
     */
    function findTopmostModal() {

        // 1 ── notification-modal-overlay (highest priority – dynamically appended)
        const notifModal = window.notificationModal?.currentModal;
        if (notifModal && document.body.contains(notifModal)) {
            return {
                close() {
                    const btn = findCancelButton(notifModal);
                    if (btn) btn.click();
                    else     window.notificationModal.close();
                },
                primaryBtn() {
                    return (
                        notifModal.querySelector('[data-action="confirm"]') ||
                        notifModal.querySelector('[data-action="ok"]')      ||
                        findPrimaryButton(notifModal)
                    );
                }
            };
        }

        // 2 ── admin panel (display:block / display:none)
        const adminOverlay = document.getElementById('adminPanelOverlay');
        if (adminOverlay && adminOverlay.style.display !== 'none' && adminOverlay.style.display !== '') {
            // Sub-modal inside admin panel takes priority
            const customItemForm = document.getElementById('customItemFormOverlay');
            if (customItemForm && customItemForm.style.display !== 'none' && customItemForm.style.display !== '') {
                return {
                    close() {
                        const btn = findCancelButton(customItemForm);
                        if (btn) btn.click();
                        else     customItemForm.style.display = 'none';
                    },
                    primaryBtn() { return findPrimaryButton(customItemForm); }
                };
            }
            return {
                close() { window.adminPanel?.close(); },
                primaryBtn() { return null; }
            };
        }

        // 3 ── guided wizard
        const guidedWizard = document.getElementById('guided-wizard-overlay');
        if (guidedWizard) {
            return {
                close() {
                    const closeBtn = document.getElementById('wizard-close');
                    if (closeBtn) closeBtn.click();
                    else if (window.guidedWizard) window.guidedWizard.close();
                },
                primaryBtn() {
                    // Last step → "Create Mob", otherwise → "Next"
                    const btn = document.getElementById('wizard-create') ||
                                document.getElementById('wizard-next');
                    return (btn && !btn.disabled) ? btn : null;
                }
            };
        }

        // 4 ── creation mode selector  (open = class "active" present)
        const creationSelector = document.getElementById('creationModeSelectorOverlay');
        if (creationSelector && creationSelector.classList.contains('active')) {
            return {
                close() {
                    const closeBtn = document.getElementById('creationModeClose');
                    if (closeBtn) closeBtn.click();
                    else if (window.creationModeSelector) window.creationModeSelector.close();
                    else creationSelector.classList.remove('active');
                },
                primaryBtn() { return null; }
            };
        }

        // 5 ── auth modal
        const authModal = document.getElementById('authModal');
        if (authModal && !authModal.classList.contains('hidden')) {
            return {
                close() {
                    const closeBtn = document.getElementById('auth-modal-close');
                    if (closeBtn) closeBtn.click();
                    else if (window.editor?.authUI) window.editor.authUI.closeModal();
                    else authModal.classList.add('hidden');
                },
                // Forms handle their own ENTER (submit); don't hijack
                primaryBtn() { return null; }
            };
        }

        // 6 ── modal-container modals  (via createModal() in app.js)
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer && modalContainer.innerHTML.trim() !== '') {
            const overlay = modalContainer.querySelector('.modal-overlay');
            if (overlay) {
                return {
                    close() {
                        const btn = findCancelButton(overlay);
                        if (btn) btn.click();
                        else if (window.editor?.closeModal) window.editor.closeModal();
                    },
                    primaryBtn() { return findPrimaryButton(overlay); }
                };
            }
        }

        // 7 ── dynamic inline modal-overlays appended directly to <body>
        //       (conflict, diff, autosave, mob/skill creation dialogs, etc.)
        const inlineOverlay = (() => {
            // Collect candidates: direct .modal-overlay children of body that are visible
            const candidates = Array.from(
                document.querySelectorAll('body > .modal-overlay')
            ).filter(el => {
                // Exclude auth modal (handled in step 5) and hidden ones
                if (el.id === 'authModal') return false;
                if (el.classList.contains('hidden')) return false;
                // For overlays using display:none style:
                if (el.style.display === 'none') return false;
                return true;
            });
            return candidates.length > 0 ? candidates[candidates.length - 1] : null;
        })();

        if (inlineOverlay) {
            return {
                close() {
                    const btn = findCancelButton(inlineOverlay);
                    if (btn) btn.click();
                    else     inlineOverlay.classList.add('hidden');
                },
                primaryBtn() { return findPrimaryButton(inlineOverlay); }
            };
        }

        // 8 ── legal modals
        const legalModal = document.querySelector('.legal-modal-overlay:not(.hidden)');
        if (legalModal) {
            return {
                close() {
                    legalModal.classList.add('hidden');
                },
                primaryBtn() {
                    return legalModal.querySelector('.legal-modal-close-btn') ||
                           findPrimaryButton(legalModal);
                }
            };
        }

        // 9 ── static modals:  settings, change-history, mode-comparison
        const staticModal = document.querySelector('.modal:not(.hidden)');
        if (staticModal) {
            return {
                close() {
                    const btn = findCancelButton(staticModal);
                    if (btn) btn.click();
                    else     staticModal.classList.add('hidden');
                },
                primaryBtn() { return findPrimaryButton(staticModal); }
            };
        }

        // 10 ── onboarding tour
        if (window.onboardingTour?.isActive) {
            return {
                close() { window.onboardingTour.skip(); },
                primaryBtn() {
                    return document.querySelector('.onboarding-tooltip .next-btn');
                }
            };
        }

        return null;
    }

    // ──────────────────────────────────────────── public helper ──

    /**
     * Returns true when at least one modal/overlay is currently visible.
     * Used by app.js to suppress the "ESC → go to dashboard" shortcut.
     */
    window.isAnyModalOpen = function () {
        if (findTopmostModal() !== null) return true;
        // Skill Line Builder uses its own keyboard system; just detect visibility here
        const slb = document.getElementById('skillLineBuilderOverlay');
        if (slb && slb.style.display && slb.style.display !== 'none') return true;
        return false;
    };

    // ─────────────────────────────────────────────────── main handler ──

    /**
     * Keyboard handler – runs in CAPTURE phase so it fires before any
     * bubble-phase listeners (e.g., setupKeyboardShortcuts in app.js).
     *
     * When a modal is handled:
     *   - e.preventDefault()  – prevents browser defaults
     *   - e.stopPropagation() – prevents the event from descending to target
     *                           and then bubbling back up (so bubble-phase
     *                           handlers like dashboard-navigation are skipped)
     *
     * When NO modal is open the event is left untouched so existing behaviour
     * (dashboard navigation, command palette, etc.) continues to work normally.
     */
    document.addEventListener('keydown', function (e) {

        // ── ESC: close topmost modal ──────────────────────────────────────
        if (e.key === 'Escape') {
            const modal = findTopmostModal();
            if (modal) {
                e.preventDefault();
                e.stopPropagation();   // stop descent + bubbling (dashboard nav etc.)
                modal.close();
            }
            // If nothing is open: fall through to existing ESC handlers.
            return;
        }

        // ── ENTER: trigger primary action ─────────────────────────────────
        if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            // Never hijack ENTER while the user is typing in a text control.
            if (isTypingInInput()) return;

            // If a focusable button is already focused the browser fires it
            // naturally — don't double-click it.
            const focused = document.activeElement;
            if (focused && focused.tagName === 'BUTTON' && !focused.disabled) return;

            const modal = findTopmostModal();
            if (modal) {
                const btn = modal.primaryBtn();
                if (btn && !btn.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.click();
                }
            }
        }

    }, true /* capture phase */);

})();
