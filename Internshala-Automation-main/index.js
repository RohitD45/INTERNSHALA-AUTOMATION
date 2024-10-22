const pup = require("puppeteer");
let { id, pass } = require("./secret");
let tab;
let dataFile = require("./data");
const path = require('path');  // Correctly require the path module
const resumePath = path.resolve('C:/Users/bhagv/Downloads/Internshala-Automation-main/Resume/Resume.pdf');  // Correctly resolve path

async function main() {
    let browser = await pup.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    let pages = await browser.pages();
    tab = pages[0];
    await tab.goto("https://internshala.com/");
    await tab.click("button.login-cta");
    await tab.type("#modal_email", id);
    await tab.type("#modal_password", pass);
    await tab.click("#modal_login_submit");
    await tab.waitForNavigation({ waitUntil: "networkidle2" });

    await tab.click(".nav-link.dropdown-toggle.internship_link .is_icon_header.ic-24-filled-down-arrow");
    await tab.goto("https://internshala.com/internships/matching-preferences/");

    let profile_options = await tab.$$("#internship_list_container_1 div");
    
    let url = await tab.evaluate(function (ele) {
        return ele.getAttribute("data-href");
    }, profile_options[0]);
    
    await tab.goto("https://internshala.com" + url);
    await tab.click(".buttons_container");

    await tab.waitForSelector(".proceed-btn-container", { visible: true });
    await tab.click(".proceed-btn-container button");
    
    await tab.waitForSelector('.ql-editor');

    const coverLetter = dataFile[0].cover_letter;  // Use cover letter from dataFile
    await tab.evaluate((coverLetter) => {
        const editor = document.querySelector('.ql-editor');
        editor.innerHTML = coverLetter;
    }, coverLetter);

    // Wait for the resume upload section
    const fileInputSelector = '#custom_resume';
    await tab.waitForSelector(fileInputSelector);
    
    // Upload the resume file
    const inputElement = await tab.$(fileInputSelector);
    await inputElement.uploadFile(resumePath);  // Upload resume using the correct path
    
    await tab.waitForSelector(".next-button", { visible: true });
    await tab.click(".next-button");

    await training(dataFile[0]);

    await tab.waitForSelector(".next-button", { visible: true });
    await tab.click(".next-button");

    await tab.waitForSelector(".btn.btn-secondary.skip.skip-button", { visible: true });
    await tab.click(".btn.btn-secondary.skip.skip-button");

    await workSample(dataFile[0]);

    await tab.waitForSelector("#save_work_samples", { visible: true });
    await tab.click("#save_work_samples");

    await new Promise(function (resolve, reject) {
        return setTimeout(resolve, 1000);
    });

    await application(dataFile[0]);
}

async function graduation(data) {
    await tab.waitForSelector("#degree_completion_status_pursuing", { visible: true });
    await tab.click("#degree_completion_status_pursuing");

    await tab.type("#college", data["College"]);
    await tab.type("#degree", data["Degree"]);
    await tab.type("#stream", data["Stream"]);
    await tab.type("#performance-college", data["Percentage"]);

    await tab.click("#college-submit");
}

async function training(data) {
    await tab.waitForSelector(".experiences-tabs[data-target='#training-modal'] .ic-16-plus", { visible: true });
    await tab.click(".experiences-tabs[data-target='#training-modal'] .ic-16-plus");

    await tab.type("#other_experiences_course", data["Training"]);
    await tab.type("#other_experiences_organization", data["Organization"]);

    await tab.click("#training-submit");
}

async function workSample(data) {
    await tab.waitForSelector("#other_portfolio_link", { visible: true });
    await tab.type("#other_portfolio_link", data["link"]);
}

async function application(data) {
    await tab.goto("https://internshala.com/the-grand-summer-internship-fair");
    await tab.waitForSelector(".btn.btn-primary.campaign-btn.view_internship", { visible: true });
    await tab.click(".btn.btn-primary.campaign-btn.view_internship");

    await new Promise(function (resolve, reject) {
        return setTimeout(resolve, 2000);
    });

    let details = await tab.$$(".view_detail_button");
    let detailUrl = [];
    for (let i = 0; i < 3; i++) {
        let url = await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, details[i]);
        detailUrl.push(url);
    }

    for (let i of detailUrl) {
        await apply(i, data);
    }
}

async function apply(url, data) {
    await tab.goto("https://internshala.com" + url);

    await tab.click(".btn.btn-large");
    await tab.click("#application_button");

    let ans = await tab.$$(".textarea.form-control");
    await ans[0].type(data["hiringReason"]);
    await ans[1].type(data["availability"]);
    await ans[2].type(data["rating"]);

    await tab.click(".submit_button_container");
}

main();
