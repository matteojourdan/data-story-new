document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar-link");

    const updateActiveNav = () => {
        let currentSection = "";

        // If at the very top of the page, don't highlight any section
        if (window.scrollY < 500) {
            navLinks.forEach(link => link.classList.remove("active"));
            return;
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute("id");
            }
        });

        // Find the matching nav link, or check parent sections
        let matchedLink = null;

        navLinks.forEach(link => {
            link.classList.remove("active");
            const href = link.getAttribute("href");
            if (href && href.includes("#" + currentSection)) {
                matchedLink = link;
            }
        });

        // If no direct match, find the parent section
        if (!matchedLink && currentSection) {
            const currentElement = document.getElementById(currentSection);
            const parentSection = currentElement?.closest("section[id]")?.parentElement?.closest("section[id]");

            if (parentSection) {
                const parentId = parentSection.getAttribute("id");
                navLinks.forEach(link => {
                    const href = link.getAttribute("href");
                    if (href && href.includes("#" + parentId)) {
                        matchedLink = link;
                    }
                });
            }
        }

        if (matchedLink) {
            matchedLink.classList.add("active");
        }
    };

    window.addEventListener("scroll", updateActiveNav);
    updateActiveNav();
});
