import ServiceLocator from "../ServiceLocator";
import Logger from "../Services/Logging/Logger";
import { BadRequest } from "@curveball/http-errors";
import { Ballot } from '../../../domain_model/Ballot';
import { Score } from '../../../domain_model/Score';

const StarResults = require('../Tabulators/StarResults.js');
const AllocatedScoreResults = require('../Tabulators/AllocatedScore')
const ApprovalResults = require('../Tabulators/ApprovalResults')
const PluralityResults = require('../Tabulators/PluralityResults')
const BallotModel = ServiceLocator.ballotsDb();

const getElectionResults = async (req: any, res: any, next: any) => {
    var electionId = req.election.election_id;
    Logger.info(req, `getElectionResults: ${electionId}`);
    const ballots = await BallotModel.getBallotsByElectionID(String(electionId), req);
    if (!ballots) {
        const msg = `Ballots not found for Election ${electionId}`;
        Logger.info(req, msg);
        throw new BadRequest(msg);
    }

    const election = req.election
    const candidateNames = election.races[0].candidates.map((Candidate: any) => (Candidate.candidate_name))
    const cvr = ballots.map((ballot: Ballot) => (
        ballot.votes[0].scores.map((score: Score) => (
            score.score
        ))
    ))
    const num_winners = election.races[0].num_winners
    const voting_method = election.races[0].voting_method
    let results = {}
    if (voting_method==='STAR'){
        results = StarResults(candidateNames, cvr, num_winners)
    }
    else if (voting_method==='STAR-PR'){
        results = AllocatedScoreResults(candidateNames, cvr, num_winners)
    }
    else if (voting_method==='Approval'){
        results = ApprovalResults(candidateNames, cvr, num_winners)
    }
    else if (voting_method==='Plurality'){
        results = PluralityResults(candidateNames, cvr, num_winners)
    }
    else {
        throw new Error('Invalid Voting Method')
    }

    res.json(
        {
            Election: election,
            Results: results
        }
    )
}

module.exports = {
    getElectionResults
}
