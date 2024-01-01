function typeText() {
    var textField = document.getElementById("typing-text");
    var text = textField.firstChild.nodeValue.split("");
    textField.firstChild.nodeValue = "";
    let index = 0;

    const cursor = document.getElementById('cursor');

    function typeCharacter() {
        textField.firstChild.nodeValue += text[index];
        cursor.style.opacity = 1;
        index++;

        if (index < text.length) {
            setTimeout(typeCharacter, 100);
        }
    }
    
    function blinkCursor() {
            setInterval(() => {
                if(cursor.style.opacity == 0) {
                    cursor.style.opacity = 1;
                } else {
                    cursor.style.opacity = 0;
                }
            }, 400);

    }

    typeCharacter();
    blinkCursor();
}

function background(){
    const canvas = document.getElementById('backgroundCanvas');
    const ctx = canvas.getContext('2d');
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    class Particle {
        constructor(x, y, radius, color, speed) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.speed = speed;
        }
        update() {
            this.x += this.speed;
            this.y += Math.sin(this.x / 50) * 2; // Adjust the sine function for different movement patterns
            // Reset particle position when it goes off the screen
            if (this.x - this.radius > canvas.width) {
                this.x = 0 - this.radius;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }
    function createParticles() {
        for (let i = 0; i < 50; i++) {
            const radius = Math.random() * 3 + 1;
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const color = 'rgba(255, 255, 255, 0.6)';
            const speed = Math.random() * 2 + 1;
            particles.push(new Particle(x, y, radius, color, speed));
        }
    }
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const particle of particles) {
            particle.update();
            particle.draw();
        }
    }
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles.length = 0;
        createParticles();
    });
    createParticles();
    animate();
}

document.addEventListener('DOMContentLoaded', function () {
    // Add smooth scrolling to all anchor links inside the navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust the offset if you have a fixed header
                    behavior: 'smooth'
                });
            } else {
                window.open(this.getAttribute('href'), '_blank');
            }
        });
    });
});

    // Add event listener for scroll events
document.addEventListener('DOMContentLoaded', function () {
        let sections = document.querySelectorAll('nav a');
        let containers = [];
        sections.forEach(anchor => {
            let targetId = anchor.getAttribute('href').substring(1);
            if(targetId != 'resume.html'){
                containers.push(targetId);
            }
        });
        let currentSection = containers[0];
        
        
        document.addEventListener(
            "keydown",
            (event) => {
                event.preventDefault();
              const keyName = event.key;
          
            if(keyName == 'ArrowDown' && containers[containers.indexOf(currentSection) + 1] != undefined) {
                currentSection = containers[containers.indexOf(currentSection) + 1];
                scrollToElement(document.getElementById(currentSection));
              } else if (keyName == 'ArrowUp' && containers[containers.indexOf(currentSection) - 1] != undefined) {
                currentSection = containers[containers.indexOf(currentSection) - 1];
                scrollToElement(document.getElementById(currentSection));
              }
            },
            false,
          );
        //// Function to smoothly scroll to a specific element
        function scrollToElement(element) {
            window.scrollTo({
                top: element.offsetTop - 80, // Adjust the offset if you have a fixed header
                behavior: 'smooth'
            });
        }
    });





window.onload = function () {
    typeText();
    background();
}