/**
 * ECHO-GLANCE — Auth Page JavaScript
 * Role selector toggle, password validation, form handling
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================================
    // Role Selector — Show/Hide STR Field
    // ============================================================
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const strFieldContainer = document.getElementById('strFieldContainer');
    const strInput = document.getElementById('str_number');

    function toggleSTRField() {
        const selectedRole = document.querySelector('input[name="role"]:checked');
        if (selectedRole && strFieldContainer) {
            if (selectedRole.value === 'tenaga_medis') {
                strFieldContainer.classList.add('visible');
                if (strInput) strInput.setAttribute('required', 'required');
            } else {
                strFieldContainer.classList.remove('visible');
                if (strInput) strInput.removeAttribute('required');
            }
        }
    }

    roleRadios.forEach(radio => {
        radio.addEventListener('change', toggleSTRField);
    });

    // Initialize on page load
    toggleSTRField();

    // ============================================================
    // Password Match Validation
    // ============================================================
    const password = document.getElementById('reg-password');
    const confirmPassword = document.getElementById('confirm_password');
    const matchError = document.getElementById('passwordMatchError');

    function checkPasswordMatch() {
        if (confirmPassword && password && matchError) {
            if (confirmPassword.value && password.value !== confirmPassword.value) {
                matchError.classList.remove('hidden');
                confirmPassword.classList.add('error');
            } else {
                matchError.classList.add('hidden');
                confirmPassword.classList.remove('error');
            }
        }
    }

    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }
    if (password) {
        password.addEventListener('input', checkPasswordMatch);
    }

    // ============================================================
    // Password Toggle (Register page)
    // ============================================================
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    if (toggleRegPassword && password) {
        toggleRegPassword.addEventListener('click', function() {
            password.type = password.type === 'password' ? 'text' : 'password';
            this.textContent = password.type === 'password' ? '👁' : '🙈';
        });
    }

    // ============================================================
    // Form Submit — Loading State
    // ============================================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            // Client-side validation
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                e.preventDefault();
                checkPasswordMatch();
                confirmPassword.focus();
                return;
            }
            e.preventDefault(); // Prevent 405 Method Not Allowed

            const btn = document.getElementById('btnRegister');
            if (btn) {
                btn.classList.add('btn-loading');
                btn.disabled = true;
            }
            
            // Simulate network request then redirect
            setTimeout(() => {
                window.location.href = 'pending.html';
            }, 800);
        });
    }
});
