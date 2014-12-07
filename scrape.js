var cheerio = require('cheerio'),
    request = require('request'),
    fs = require('fs'),
    addressA = process.argv[2],
    addressB = process.argv[3];

if (! (addressA && addressB)) {
    console.log("That's wack. Give me two addresses!");
    return
}

var urlAtoB = toUrl(addressA, addressB),
    urlBtoA = toUrl(addressB, addressA),
    filenameAtoB = process.argv[4] ? process.argv[4] : 'a_to_b.csv',
    filenameBtoA = process.argv[5] ? process.argv[5] : 'b_to_a.csv';

getTravelTimeAndUpdateCsv(urlAtoB, filenameAtoB);
getTravelTimeAndUpdateCsv(urlBtoA, filenameBtoA);

function updateCsv(filename, time) {
    var date = new Date(),
        dataToWrite;

    // if it's the beginning of the day (before 12:05am), write the day of the week
    if (date.getHours() == 0 && date.getMinutes() < 5) {
        dataToWrite = getDayOfWeek() + ', ' + time + ', ';

    // if it's the end of the day (past 11:45pm), finish the line
    } else if (date.getHours() == 23 && date.getMinutes() >= 45) {
        dataToWrite = time + '\n';
    } else {
        dataToWrite = time + ', ';
    }

    fs.appendFile(filename, dataToWrite, function(error) {
        if (error) {
            throw error
        }
    });
}

function getDayOfWeek() {
    var intDay = new Date().getDay(),
        weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return weekdays[intDay]
}

function toUrl(from, to) {
    return 'http://www.google.com/maps?t=m' +
        '&saddr=' + encodeURIComponent(from) +
        '&daddr=' + encodeURIComponent(to) +
        '&output=classic&dg=ntvo'
}

Array.prototype.indexOfRegex = function(regex) {
    var matchFound = false,
        indexWhereFound;

    // perfect opportunity to use ECMAScript 6's "for..of" here, but `node --harmony` doesn't support that yet :(
    this.forEach(function logArrayElements(element, index) {
        if (! matchFound && element.match(regex)) {
            indexWhereFound = index;
            matchFound = true;
        }
    });

    return indexWhereFound ? indexWhereFound : -1
}

function timeStringToMinutes(timeString) {
    var BASE_TEN = 10,
        tokens = timeString.split(' '),
        hoursValueIndex = tokens.indexOfRegex(/hours?$/) - 1,
        minutesValueIndex = tokens.indexOfRegex(/mins?$/) - 1,
        secondsValueIndex = tokens.indexOfRegex(/secs?$/) - 1,
        numOfHours = parseInt(tokens[hoursValueIndex], BASE_TEN),
        numOfMinutes = parseInt(tokens[minutesValueIndex], BASE_TEN),
        numOfSeconds = parseInt(tokens[secondsValueIndex], BASE_TEN);

    numOfHours = numOfHours ? numOfHours : 0;
    numOfMinutes = numOfMinutes ? numOfMinutes : 0;

    return numOfHours * 60 + numOfMinutes + (numOfSeconds ? 1 : 0);
}

function getTravelTimeAndUpdateCsv(url, filename) {
    request(url, function(error, response, html) {
        if (! error && response.statusCode == 200) {
            var $ = cheerio.load(html),
                timeString = $("span:contains('In current traffic:')").first().text(),
                timeInMinutes = timeStringToMinutes(timeString);

            updateCsv(filename, timeInMinutes);
        } else {
            console.log('error!')
        }
    });
}
