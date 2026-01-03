// ===== Particles Configuration =====
particlesJS('particles-js', {
    particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: '#bc13fe' },
        shape: { type: 'circle' },
        opacity: { value: 0.2, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: '#00f0ff', opacity: 0.2, width: 1 },
        move: { enable: true, speed: 2, direction: 'none', random: true, out_mode: 'out' }
    },
    interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' } },
        modes: { grab: { distance: 140, line_linked: { opacity: 0.6 } } }
    },
    retina_detect: true
});

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Navbar Background on Scroll =====
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Form Submission =====
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = signupForm.querySelector('input[type="email"]').value;

        // Show success animation
        const btn = signupForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Check your email!';
        btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            signupForm.reset();
        }, 3000);

        console.log('Email submitted:', email);
    });
}

// ===== Intersection Observer for Animations =====
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in animation to cards
document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    fadeInObserver.observe(card);
});

// ===== Counter Animation for Stats =====
const animateCounter = (element, target, suffix = '') => {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + suffix;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + suffix;
        }
    };

    updateCounter();
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValues = entry.target.querySelectorAll('.stat-value');
            statValues.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const suffix = stat.dataset.suffix || '';
                if (target) {
                    animateCounter(stat, target, suffix);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

console.log('🚀 AdsEngineer.cloud premium loaded!');
