document.addEventListener("DOMContentLoaded", () => {
    // Observer for research questions
    const questionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.research-question').forEach(q => questionObserver.observe(q));

    // Observer for generic scroll animations (uses your .animate-on-scroll class)
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => animateObserver.observe(el));

    // Floating Research Question Sidebar - using IntersectionObserver (no scroll listener)
    const sidebar = document.getElementById('sidebar-question');
    const sidebarText = document.getElementById('sidebar-question-text');
    const sidebarTitle = document.getElementById('sidebar-question-title');

    const sections = [
        {
            id: 'diff_ana',
            title: '1.',
            text: 'Can we identify and score key genes and cells participating in the immune response to COVID-19?'
        },
        {
            id: 'temp_ana',
            title: '2.',
            text: 'Can we reconstruct the timeline and trajectory of a patient\'s COVID-19 infection?'
        },
        {
            id: 'pred_mod',
            title: '3.',
            text: 'Can a patient\'s immune profile combined with their intrinsic characteristics (sex, age, smoking habits, ...) be used to predict the severity of their infection?'
        }
    ];

    if (sidebar && sidebarText && sidebarTitle) {
        const sidebarObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = sections.find(s => s.id === entry.target.id);
                    if (section) {
                        sidebarTitle.textContent = section.title;
                        sidebarText.textContent = section.text;
                        sidebar.classList.add('visible');
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '-10% 0px -80% 0px' });

        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) sidebarObserver.observe(element);
        });

        // Hide sidebar when back at intro/research questions section
        const introObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sidebar.classList.remove('visible');
                }
            });
        }, { threshold: 0.3 });

        const intro = document.getElementById('research_questions');
        if (intro) introObserver.observe(intro);
    }
});
