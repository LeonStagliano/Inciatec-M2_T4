// --------------------------------------------- Selección de Cámara -----------------------------------------
let chamberName

if (document.title === "Senate Congress 117" || document.title === "Senate Attendance" || document.title === "Senate Loyalty") {
    chamberName = `senate`
}
if (document.title === "House Congress 117" || document.title === "House Attendance" || document.title === "House Loyalty") {
    chamberName = `house`
}

// ---------------------------------------------- Pedido de Datos -------------------------------------------

const url = `https://api.propublica.org/congress/v1/117/${chamberName}/members.json`
const key = `OPnQTYwGj99AkEgxN4klLA0v4aLd6ZL3Hq373Xqq`

const options = {
    method: 'GET',
    headers: {
        "X-API-Key": key
    }
}

const { createApp } = Vue

createApp({
    data() {
        return {
            accordionBtn: `Read More`,
            chamberMembers: [],
            chamberFiltered: [],
            checkValues: [],
            selectValue: 'All States',
            states: [],
            parties: [
                {
                    name: `Democrats`,
                    abb: `D`
                },
                {
                    name: `Republicans`,
                    abb: `R`
                },
                {
                    name: `Independents`,
                    abb: `ID`
                }
            ],
            totalAverageOfPartyVotes: 0,
            leastEngaged: [],
            mostEngaged: [],
            leastLoyals: [],
            mostLoyals: [],
            isLoading: true
        }
    },
    created() {
        chamberName && fetch(url, options)
            .then(request => request.json())
            .then(data => {
                this.chamberMembers = data.results[0].members
                this.chamberFiltered = data.results[0].members
                this.isLoading = false

                this.catchStates()
                this.states.sort()
                this.dataOfParties()
                this.totalAverageOfPartyVotes = this.calcTotalAverageOfPartyVotes()
                this.chamberMembers = this.totalVotesWithParty(this.chamberMembers)
                this.leastEngaged = this.mostTenPercent(this.chamberMembers, `missed_votes_pct`)
                this.mostEngaged = this.leastTenPercent(this.chamberMembers, `missed_votes_pct`)
                this.leastLoyals = this.leastTenPercent(this.chamberMembers, `votes_with_party_pct`)
                this.mostLoyals = this.mostTenPercent(this.chamberMembers, `votes_with_party_pct`)
            })
            .catch(err => console.log(err))

    },
    methods: {
        changeText: function () { this.accordionBtn === `Read More` ? this.accordionBtn = `Read Less` : this.accordionBtn = `Read More` },
        catchStates: function () {
            this.chamberMembers.forEach(member => this.states.includes(member.state) ? `` : this.states.push(member.state))
        },
        dataOfParties: function () {
            this.parties.forEach((element, i) => {
                this.parties[i].members = this.chamberMembers.filter(member => member.party === element.abb)
                this.parties[i].noOfMembers = this.parties[i].members.length
                this.parties[i].averageOfPartyVotes = this.averageOfVotes(this.parties[i].members).toFixed(2)
            })
        },
        averageOfVotes: function (party) {
            let averageOfVotes = party.filter(member => member.votes_with_party_pct).reduce((acc, act) => acc + act.votes_with_party_pct, 0) / party.length
            if (averageOfVotes) {
                return averageOfVotes
            } else {
                return 0
            }
        },
        calcTotalAverageOfPartyVotes: function () {
            let partiesPresent = []
            let total = 0
            this.parties.forEach(party => {
                total = total + parseFloat(party.averageOfPartyVotes)
                if (parseFloat(party.averageOfPartyVotes)) {
                    partiesPresent.push(1)
                }
            })
            return (total / partiesPresent.length).toFixed(2)
        },
        totalVotesWithParty: function (chamber) {
            for (member of chamber) {
                let totalVotesWithParty = this.percent(member.total_votes, member.votes_with_party_pct)
                member.total_votes_with_party = totalVotesWithParty
            }
            return chamber
        },
        percent: function (total, percent) {
            let percentValue = (total / 100) * percent
            return Math.ceil(percentValue)
        },
        leastTenPercent: function (chamber, property) {
            let least = [...chamber].filter(e => e[property] || e[property] === 0).sort((a, b) => this.smallestToLargest(a, b, [property]))
            reference = least[this.percent([...least].length, 10) - 1][property]
            return least.filter(element => element[property] <= reference)
        },
        mostTenPercent: function (chamber, property) {
            let most = [...chamber].filter(e => e[property] || e[property] === 0).sort((a, b) => this.largestToSmallest(a, b, [property]))
            reference = most[this.percent([...most].length, 10) - 1][property]
            return most.filter(element => element[property] >= reference)
        },
        smallestToLargest: function (a, b, property) {
            if (a[property] < b[property]) {
                return -1
            }
            if (a[property] > b[property]) {
                return 1
            }
            return 0
        },
        largestToSmallest: function (a, b, property) {
            if (a[property] > b[property]) {
                return -1
            }
            if (a[property] < b[property]) {
                return 1
            }
            return 0

        }
    },
    computed: {
        filter: function () {
            this.chamberFiltered = this.chamberMembers.filter(member => {
                return (this.checkValues.includes(member.party) || this.checkValues.length === 0)
                    && (this.selectValue === member.state || this.selectValue === `All States`)
            })
        }
    }
}).mount(`#app`)