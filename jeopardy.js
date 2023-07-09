// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const api_url = "https://jservice.io/api/";
const cats = 6;
const catClues = 5;

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  let res = await axios.get(`${api_url}categories?count=100`);
  let catIds = res.data.map(c => c.id);
  return _.sampleSize(catIds, cats);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

function getCategory(catId) {
  return axios.get(`${api_url}category?id=${catId}`)
    .then((res) => {
      let cat = res.data;
      let allClues = cat.clues;
      let ranClues = _.sampleSize(allClues, catClues);
      let clues = ranClues.map(c => ({
        question: c.question,
        answer: c.answer,
        showing: null,
      }));

      return { title: cat.title, clues };
    });
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
  const $jboard = $("#board");
  $jboard.addClass("loading")
  
  $("#jeopardy thead").empty();

  const $tableHeadersRow = $("<tr>");
  for (const category of categories) {
    const $header = $("<th>").text(category.title);
    $tableHeadersRow.append($header);
  }
  $("#jeopardy thead").append($tableHeadersRow);

  $("#jeopardy tbody").empty();

  for (let clueIndex = 0; clueIndex < catClues; clueIndex++) {
    const $tableRow = $("<tr>");
    for (let categoryIndex = 0; categoryIndex < cats; categoryIndex++) {
      const cellId = `${categoryIndex}-${clueIndex}`;
      const $tableCell = $("<td>").attr("id", cellId).text("?");
      $tableRow.append($tableCell);
    }
    $("#jeopardy tbody").append($tableRow);
    $jboard.removeClass("loading");
  }
}
/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  const id = evt.target.id;
  const [catId, clueId] = id.split("-");
  const clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
  } else {
    return;
  }

  $(`#${catId}-${clueId}`).html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
  $("#spinner").show();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#spinner").hide();
}

window.addEventListener('DOMContentLoaded', async function() {
  showLoadingView();
  let catIds = await getCategoryIds();
  categories = [];
  for (let catId of catIds) {
    categories.push(await getCategory(catId));
  }
  fillTable();
  hideLoadingView();
});

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();
  let catIds = await getCategoryIds();
  categories = [];
  for (let catId of catIds) {
    categories.push(await getCategory(catId));
  }
  fillTable();
  hideLoadingView();
}


/** On click of start / restart button, set up game. */

$("#restart").on("click", function() {
  showLoadingView();
  setupAndStart();
});

/** On page load, add event handler for clicking clues */

$(async function () {
      setupAndStart();
      $("#jeopardy").on("click", "td", handleClick);
    }
  );