function extractor_onload() {
    console.log("Extractor loaded");
    fetch("https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js").then((res)=>(res.text().then((res)=>(eval(res)))));
    //console.log(genCalendar()); // usually doesn't work
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

/*
function getMonthNum(month) {
    //return (MONTHS.indexOf(month)+1).toString().padStart(2, '0');
}
*/

/** 
 * @param {HTMLElement} elt 
 * @return {String}
 */
function findMonthTitleString(elt) {
    let prev = elt.parentElement;
    while (prev !== elt.parentElement.parentElement.firstChild && prev !== null && prev !== undefined) {
        //console.log(prev);
        if (MONTHS.includes(prev.firstChild.innerText.split(" ")[0])) return prev.firstChild.innerText;
        prev = prev.previousSibling;
    }
    return elt.parentElement.parentElement.firstChild.firstChild.innerText;
}

function findYears() {
    let index = document.body.innerText.search(/Class of [0-9]{4}/g);
    let year2 = parseInt(document.body.innerText.substring(index+9, index+13), 10);
    return [year2-1, year2];
}

function findStartDateElt() {
    return Array.from(document.querySelectorAll('td > p')).filter((x)=>{return x.innerText.includes("SCHOOLS OPEN")})[0].parentElement.previousSibling.firstChild;
}

function findStartDate() {
    let text = findStartDateElt().innerText;
    let terms = text.split(". ");
    return new Date(findYears()[0], MONTHS.indexOf(MONTHS.filter((x)=>{return x.startsWith(terms[0])})[0]), terms[1]);
}

function isStartDateDelayed() {
    return findStartDateElt().parentElement.parentElement.innerText.includes("DELAYED OPENING");
}

function findEndDate() {
    let text = Array.from(document.querySelectorAll('td')).filter((x)=>{return x.firstChild !== null && x.firstChild.innerText === 'MP 4'})[0].nextSibling.innerText;
    let terms = text.split(" ");
    return new Date(terms[terms.length - 1], MONTHS.indexOf(terms[0]), terms[1].substring(0, terms[1].length - 1));
}

function genCalendar() {
    let boxes = Array.from(document.querySelectorAll('td'));
    const START_DATE = findStartDate();
    const END_DATE = findEndDate();
    let calendar = {
        closed: [], 
        delayed: [], 
        early_dismissal: [], 
        student_early_dismissal: [],
        staff_only: [],
        regular: []
    };
    if (isStartDateDelayed()) calendar.delayed.push(START_DATE.toISOString().split('T')[0]);
    for (i = 0; i < boxes.length; i++) {
        let style = window.getComputedStyle(boxes[i]);
        if (boxes[i].children.length == 1 && boxes[i].firstChild.matches('p') && /^\d+$/.test(boxes[i].firstChild.innerText)) {
            // element is date box
            
            // find month title box
            let month_terms = findMonthTitleString(boxes[i]).split(" ");
            let date = new Date(month_terms[1], MONTHS.indexOf(month_terms[0]), boxes[i].firstChild.innerText);
            if ([0, 6].includes(date.getDay()) || date > END_DATE || date < START_DATE) continue;
            let val = date.toISOString().split('T')[0];
            let targ;
            switch (style.backgroundColor) {
                case 'rgb(255, 0, 0)':
                    targ = calendar.closed;
                    break;
                case 'rgb(0, 176, 240)':
                    targ = calendar.early_dismissal;
                    break;
                case 'rgb(0, 175, 80)':
                    targ = calendar.student_early_dismissal;
                    break;
                case 'rgb(255, 255, 0)':
                case 'rgb(255, 153, 0)':
                    targ = calendar.staff_only;
                    break;
                default:
                    targ = calendar.regular;
                    //boxes[i].style.border = 'dashed blue 1px';
            }
            if (!targ.includes(val)) targ.push(val);
            
        }
        //console.log(style.backgroundColor == 'rgb(255, 0, 0)');
    }
    return calendar;
}

function saveCalendar() {
    const blob = new Blob([JSON.stringify(genCalendar())], {type: "application/json;charset=utf-8"});
    saveAs(blob, 'calendar-data.json');
}