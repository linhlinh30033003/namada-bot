const { execSync } = require("child_process");

// get current epoch number
async function getCurrentEpoch() {
  const stdout = execSync(`namadac epoch --node ${process.env.RPC}`, { encoding: "utf8" }).trim();
  const epoch = parseInt(stdout.match(/\d+/)[0]);
  console.log(`Current epoch: ${epoch}`);
  return epoch;
}

// get a list of new proposals since the last query
function queryProposals(lastKnown) {
  const proposals = [];

  // get latest on-chain prop id
  const stdout = execSync("namadac query-proposal", {
    encoding: "utf8",
  }).trim();
  const id = parseInt(stdout.match(/id:\s+(\d+)/)[1]);

  if (id - lastKnown === 1) return proposals;

  // iterate over all new proposals and query their detailed info
  for (let proposalId = lastKnown; proposalId < id; proposalId++) {
    const result = execSync(
      `namadac query-proposal --proposal-id ${proposalId}`,
      { encoding: "utf8" }
    );

    if (result.includes("No proposal found with id")) continue;

    const proposalInfo = {};
    const lines = result.trim().split("\n");
    for (const line of lines) {
      const [key, value] = line.split(/:\s*/, 2);
      proposalInfo[key.trim()] = value.trim();
    }

    const content = JSON.parse(proposalInfo["Content"]);
    proposalInfo["Content"] = content;

    proposals.push(proposalInfo);
  }

  return proposals;
}

// format a single proposal data for TG notification
function formatNotification(proposal) {
  const content = proposal["Content"];
  const id = proposal["Proposal Id"];
  const start = proposal["Start Epoch"];
  const end = proposal["End Epoch"];
  const propType = proposal["Type"];
  const author = proposal["Author"];
  const abstract = content.get("abstract");
  const authors = content.get("authors");
  const details = content.get("details");
  const discussion = content.get("discussions-to");
  const license = content.get("license");
  const motivation = content.get("motivation");
  const title = content.get("title");
  const text = `Proposal ${id} is up for voting now!\nTitle:\n${title}\n\nType: ${propType}\n\nAbstract:\n${abstract}\n\nAuthor:\n${author}`;
  return text;
}

module.exports = {
  getCurrentEpoch,
  queryProposals,
  formatNotification,
};
