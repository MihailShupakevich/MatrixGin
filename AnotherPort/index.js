const BUTTON = 'BUTTON';
const CHECKBOX = 'checkbox';
const SPAN = 'SPAN';
const DATA_ID = 'data-id';
const READ_ONLY = 'readonly';
const NONE = 'NONE';
// const ALL = 'allTasks';
const CLASS = 'class';
const ID = 'id';
const CHECKED = 'checked';
const DANGER_STYLE = 'btn btn-sm btn-circle btn-outline-danger';
const PRIMARY_STYLE = 'btn btn-sm btn-circle btn-outline-primary';
const VIEW_COUNT = 5;
const DBCLICK_NODE = 2;
const ENTER = 13;
const ESCAPE = 27;
const { _ } = window;
const mainInput = document.getElementById('taskInput');
const btnTask = document.getElementById('addButton');
const ulTask = document.getElementById('ul');
const globalCheckbox = document.getElementById('globalCheckbox');
const allDeleteComplete = document.getElementById('allDeleteComplete');
const allButtons = document.getElementById('allButtons');
const pgContainer = document.getElementById('pageContainer');
const errorBlock = document.getElementById('errorBlock');
const URL_BACK = 'http://localhost:8080';
const TIME_OUT = 2000;
let curPage = 1;
let filterType = 'allTasks';
let arrayTask = [];

const errorBlockFn = (errorText) => {
    errorBlock.textContent = errorText;
    errorBlock.classList.add('visible');
    setTimeout(() => errorBlock.classList.remove('visible'), TIME_OUT);
};

const goToNextPage = () => {
    const countPage = Math.ceil(arrayTask.length / VIEW_COUNT);
    if ((countPage) > (curPage)) {
        curPage = countPage;
    }
};

const typeBtnSwitch = () => {
    switch (filterType) {
        case 'activeTasks':
            return arrayTask.filter((obj) => !obj.isChecked);
        case 'completedTasks':
            return arrayTask.filter((obj) => obj.isChecked);
        default:
            return arrayTask;
    }
};

const goToPrevPage = () => {
    const filteredTasks = typeBtnSwitch();
    const numberOfPage = Math.ceil(filteredTasks.length / VIEW_COUNT);
    curPage = numberOfPage < curPage
        ? numberOfPage
        : curPage;
};

const createPageButtons = (tasksLength) => {
    const pagesCount = Math.ceil(tasksLength / VIEW_COUNT);
    let htmlList = '';
    for (let i = 1; i <= pagesCount; i += 1) {
        const active = i === curPage ? DANGER_STYLE : PRIMARY_STYLE;
        htmlList += `
          <button type="button" data-bs-toggle="button" class="${active}">${i}</button>`;
    }
    pgContainer.innerHTML = htmlList;
};

const deleteSpace = () => mainInput.value.replace(/\s+/g, ' ').trim();

const buttonRefresh = () => {
    allButtons.children[0].setAttribute('class', PRIMARY_STYLE);
    allButtons.children[1].setAttribute('class', PRIMARY_STYLE);
    allButtons.children[2].setAttribute('class', PRIMARY_STYLE);
    if (filterType === 'allTasks') {
        allButtons.children[0].setAttribute('class', DANGER_STYLE);
    }
    if (filterType === 'activeTasks') {
        allButtons.children[1].setAttribute('class', DANGER_STYLE);
    }
    if (filterType === 'completedTasks') {
        allButtons.children[2].setAttribute('class', DANGER_STYLE);
    }
};

const styleButtonRender = () => {
    buttonRefresh();
    allButtons.children[0].textContent = 'Все задачи';
    allButtons.children[2].textContent = 'Выполненные задачи';
    allButtons.children[1].textContent = 'Активные задачи';
};

function rendering() {
    const filteredTasks = typeBtnSwitch();
    const arrayTaskNew = filteredTasks.slice(((curPage - 1) * VIEW_COUNT), (curPage * VIEW_COUNT));
    let htmlList = '';
    arrayTaskNew.forEach((element) => {
        const checkedComplete = element.isChecked ? CHECKED : '';
        htmlList += `
          <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${element.id}" >
          <input ${checkedComplete} type="checkbox" class="first-input ms-2 me-2">
          <span type="submit" class="customclass overflow-auto ms-2 me-2">${element.text}</span>
          <input hidden  id="section-input" class="ms-5 me-5  overflow-auto form-control form-control-md" value="${element.text}"></input>
          <button   type="submit" class="btn-close float-sm-right ml-auto float-right" aria-label="Close"></button>
          </li>`;
    });
    ulTask.innerHTML = htmlList;
    styleButtonRender();
    createPageButtons(filteredTasks.length);
    globalCheckbox.checked = arrayTask.length !== 0
        ? arrayTask.every((item) => item.isChecked)
        : false;
}

function fetchAllTasksFromBD() {
    fetch(URL_BACK)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            allButtons.classList.add('btn-active');
            arrayTask = data;
            rendering();
        })
        .catch((error) => errorBlockFn(error));
}

const addTask = () => {
    fetch(URL_BACK, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
            text: _.escape(deleteSpace()),
        }),
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Ошибка при добавлении задачи');
        })
        .then((addedTask) => {
            arrayTask.push(addedTask);
            mainInput.value = '';
            goToNextPage();
            rendering();
        })
        .catch((error) => errorBlockFn(error));
};

const addByEnter = (e) => {
    const key = e.which || e.keyCode;
    if (key === ENTER) {
        btnTask.click();
    }
};

const redaxTask = (taskId, data) => {
    fetch(`${URL_BACK}/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((res) => res.json())
        .then((newTask) => {
            const needIndex = arrayTask.findIndex((obj) => obj.id === taskId);
            arrayTask.splice(needIndex, 1, newTask);
        })
        .catch((error) => errorBlockFn(error));
};
const fetchDeleteTask = (taskId) => {
    fetch(`${URL_BACK}/${taskId}`, {
        method: 'DELETE',
    })
        .then((response) => {
            if (response.ok) {
                const needIndex = arrayTask.findIndex((obj) => obj.id === taskId);
                arrayTask.splice(needIndex, 1);
                fetchAllTasksFromBD();
                rendering();
            } else throw new Error('HTTP error: ');
        });
};

const editTask = (e) => {
    const taskId = e.target.parentNode.getAttribute(DATA_ID);
    if (e.target.tagName === BUTTON) {
        goToPrevPage();
        fetchDeleteTask(taskId);
    }
    if (e.target.type === CHECKBOX) {
        redaxTask(taskId, { isChecked: e.target.checked });
    }
    if ((e.target.tagName === SPAN) && (e.detail === DBCLICK_NODE)) {
        e.target.removeAttribute(READ_ONLY);
        e.target.style.display = NONE;
        e.target.parentNode.children[2].hidden = false;
        e.target.parentNode.children[2].focus();
    }
};

const saveChanges = (event) => {
    if (event.target.tagName === 'INPUT' && event.target.type === 'text') {
        const pureText = _.escape(event.target.parentNode.children[2].value.replace(/\s+/g, ' ').trim());
        if (pureText !== '') {
            const taskId = event.target.parentNode.getAttribute(DATA_ID);
            redaxTask(taskId, { text: pureText });
            // fetchAllTasksFromBD();
        } else {
            rendering();
        }
    }
};

const saveOrExit = (event) => {
    if (event.keyCode === ESCAPE) {
        rendering();
    }
    if (event.keyCode === ENTER) {
        saveChanges(event);
    }
};

const fullCheckbox = () => {
    fetch(URL_BACK, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            isChecked: globalCheckbox.checked,
        }),
    })
        .then(() => {
            arrayTask.forEach((element) => {
                element.isChecked = globalCheckbox.checked;
            });
            rendering();
        })
        .catch((error) => errorBlockFn(error));
};

const deleteFetchCompleteTasks = () => {
    fetch(URL_BACK, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        // .then((response) => {
        //   if (!response.ok) {
        //     throw new Error(`HTTP error ${response.status}`);
        //   }
        //   return response;
        // })
        .then(() => {
            arrayTask = arrayTask.filter((element) => element.isChecked === false);
            rendering();
        })
        .catch((error) => errorBlockFn(error));
};

const changeFilterType = (event) => {
    if (event.target.tagName === BUTTON) {
        event.target.setAttribute(CLASS, DANGER_STYLE);
        const buttonId = event.target.getAttribute(ID);
        filterType = buttonId;
        curPage = 1;
        rendering();
    }
};

const changePage = (event) => {
    if (event.target.tagName === BUTTON) {
        curPage = Number(event.target.textContent);
        rendering();
    }
};

window.onload = fetchAllTasksFromBD();
btnTask.addEventListener('click', addTask);
globalCheckbox.addEventListener('click', fullCheckbox);
mainInput.addEventListener('keypress', addByEnter);
ulTask.addEventListener('click', editTask);
ulTask.addEventListener('keydown', saveOrExit);
ulTask.addEventListener('blur', saveChanges, true);
allDeleteComplete.addEventListener('click', deleteFetchCompleteTasks);
allButtons.addEventListener('click', changeFilterType);
pgContainer.addEventListener('click', changePage);
