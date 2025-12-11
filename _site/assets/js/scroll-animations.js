document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, observerOptions);

    const questions = document.querySelectorAll('.research-question');
    questions.forEach(q => observer.observe(q));

    // Floating Research Question Logic
    const sidebar = document.getElementById('sidebar-question');
    const sidebarText = document.getElementById('sidebar-question-text');

    const sections = [
        {
            id: 'diff_ana',
            text: '1. Can we identify and score key genes and cells participating in the immune response to COVID-19?'
        },
        {
            id: 'temp_ana',
            text: '2. Can we reconstruct the timeline and trajectory of a patient’s COVID-19 infection?'
        },
        {
            id: 'pred_mod',
            text: '3. Can a patient’s immune profile combined with their intrinsic characteristics (sex, age, smoking habits, ...) be used to predict the severity of their infection?'
        }
    ];

    function updateSidebar() {
        if (!sidebar || !sidebarText) return;

        let activeSection = null;
        const viewportHeight = window.innerHeight;
        // Check point: middle of the screen
        const checkPoint = viewportHeight / viewportHeight;

        for (const section of sections) {
            const element = document.getElementById(section.id);
            if (element) {
                const rect = element.getBoundingClientRect();
                // If the section contains the middle of the screen
                if (rect.top <= checkPoint && rect.bottom >= checkPoint) {
                    activeSection = section;
                    break;
                }
            }
        }

        if (activeSection) {
            sidebarText.textContent = activeSection.text;
            sidebar.classList.add('visible');
        } else {
            sidebar.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', updateSidebar);
    // Initial check in case we reload in the middle of the page
    updateSidebar();
});