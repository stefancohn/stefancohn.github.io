//----------- click on nav bar to scroll func ------------

//grab our navbar items that have links to somewhere else in page
let navbarElementsArray1 = document.querySelectorAll('.navbar a');
let navbarElementsArray = [navbarElementsArray1[0], navbarElementsArray1[1], navbarElementsArray1[2]]
// Add scroll to elements in navbarArray
navbarElementsArray.forEach(addScroll);

//function that adds scroll to certain in page
function addScroll(docQ) {
    //add event listern
    docQ.addEventListener('click', function(e) {
        //override html behavior with this, prevent its defualt funct
        e.preventDefault();
        //grab our target, the href 
        var target = this.getAttribute("href");
        document.querySelector(target).scrollIntoView({
            //make the scroll smooth and scroll to the end 
            behavior : "smooth",
            block : "center",
        })
    })
}
//---------make about section texts pop out when clicked-------------

var tabLinks = document.querySelectorAll('.tabLinks');
var tabContents = document.querySelectorAll('.tabContent');

//function that changes HTML so that tab is displayed and underlined
function openTab(tabName) {
    //check if button is already clicked
    var alreadyClicked = (document.querySelector(tabName).classList[1] == "active");

    tabLinks.forEach(link => link.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"))
    //if not already clicked, we display underline and text
    if (!alreadyClicked) {
        event.currentTarget.classList.add("active");
        document.querySelector(tabName).classList.add("active");
    }
}

//---------make project sections turn up when hovered------------
if (!isTouchDevice()) {
    var projectSections = document.querySelectorAll('.scrollBarSection');

    //will make fully opaque
    function revealFully(projectName) {
        var hoveredProject = document.querySelector(projectName).classList;
        hoveredProject.add("active");
    }

    //reset to default where translucent
    function hide(projectName) {
        var unhovered = document.querySelector(projectName).classList;
        var projImg = document.querySelector(projectName).querySelector('#projImg');
        unhovered.remove("active");
        //readd transDuration for nice looks
        projImg.style.transitionDuration ="0.3s";
    }

    //--------make proj img follow mouse -------
    projectSections.forEach(sect => sect.addEventListener('mousemove', function(e) {
        //get our projImg to edit its css and the left & top of mouse
        var projImg = sect.querySelector('#projImg');

        //abs pos of cursor in website
        let left = e.offsetX;
        //mouse pos rel to container
        let top = e.offsetY;

        //rel position of element within parent container
        var rectTop = sect.offsetTop;

        var yPos = top + rectTop;

        //handle edge case where child container comes in contact with mouse
        if (e.target != sect) {
            top = e.offsetY + e.target.offsetTop;
            yPos = top;
            left = e.offsetX + e.target.offsetLeft;
        }

        //edge case if we are at last element, we restrict that the image extends the overflow 
        const scrollBar = document.querySelector('.scrollBar');
        const sections = scrollBar.querySelectorAll('.scrollBarSection');
        const lastSection = sections[sections.length - 1];
        //conditional to see if image has no gone into over flow
        if ((sect == lastSection) && (yPos + projImg.offsetHeight + 20 > lastSection.offsetTop + lastSection.offsetHeight)) {
            //we then get the difference the image is leaking past the total height of the scrollbar to get its proper pos
            var diffy = (yPos + projImg.offsetHeight + 10) - (lastSection.offsetTop + lastSection.offsetHeight);
            yPos = yPos-diffy;
        }

        //add to css
        projImg.style.left = left + 10 + 'px';
        projImg.style.top = yPos + 10 + 'px';
        //remove transDuration so image doesn't lag everywhere
        projImg.style.transitionDuration = "0s";
    })) 
}

//---------from backend integration-------
//get our necessary elements (form and its children)
const contactForm = document.querySelector('.formContainer');
let fName = contactForm.querySelector('#fName');
let lName = contactForm.querySelector('#lName');
let email = contactForm.querySelector('#email');
let message = contactForm.querySelector('#message');

contactForm.addEventListener('submit', async (e) => {
	//default is to refresh page so disable
	e.preventDefault();

	let formData = {
		fName : fName.value,
		lName : lName.value,
		email : email.value,
		message : message.value
	}

	try {
		let sendData = await fetch('https://he86awsa6g.execute-api.us-east-2.amazonaws.com/dev', {
			method: "POST",
			headers: {
				"Content-Type" : "application/json",
			},
			body: JSON.stringify(formData),
		});

		const result = await sendData.text();
    		alert(result);

		//clear up form incase another message
		fName.value = '';
		lName.value='';
		email.value='';
		message.value='';
 	}

	catch (error) {
		console.log(error);
  	}
});

//---------funct to detect mobile --------
function isTouchDevice() {
    return (('ontouchstart' in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
  }
