const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("RockPaperScissors", function () {
    let RockPaperScissors, rockPaperScissors, usdt, owner, player1, player2;

    beforeEach(async function () {
        [owner, player1, player2] = await ethers.getSigners();

        // Deploy a mock USDT token for testing
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdt = await MockERC20.deploy("Mock USDT", "USDT", ethers.utils.parseEther("1000"));
        await usdt.deployed();

        // Deploy the RockPaperScissors contract
        RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
        rockPaperScissors = await RockPaperScissors.deploy(usdt.address);
        await rockPaperScissors.deployed();

        // Distribute tokens
        await usdt.transfer(player1.address, ethers.utils.parseEther("500"));
        await usdt.transfer(player2.address, ethers.utils.parseEther("500"));
    });

    it("should create a game", async function () {
        await usdt.connect(player1).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player1).createGame(10);

        const game = await rockPaperScissors.games(0);
        expect(game.player1).to.equal(player1.address);
        expect(game.state).to.equal(0); // WaitingForPlayers
    });

    it("should allow a second player to join the game", async function () {
        await usdt.connect(player1).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player1).createGame(10);

        await usdt.connect(player2).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player2).joinGame(0);

        const game = await rockPaperScissors.games(0);
        expect(game.player2).to.equal(player2.address);
        expect(game.state).to.equal(1); // InProgress
    });

    it("should end the game and assign winnings", async function () {
        await usdt.connect(player1).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player1).createGame(10);

        await usdt.connect(player2).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player2).joinGame(0);

        await rockPaperScissors.connect(player1).makeMove(0, 1); // Player 1: Paper
        await rockPaperScissors.connect(player2).makeMove(0, 0); // Player 2: Rock

        const winnings = await rockPaperScissors.winnings(player1.address);
        expect(winnings).to.equal(ethers.utils.parseEther("20")); // Total prize = 2 * 10
    });

    it("should allow players to withdraw winnings", async function () {
        await usdt.connect(player1).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player1).createGame(10);

        await usdt.connect(player2).approve(rockPaperScissors.address, ethers.utils.parseEther("10"));
        await rockPaperScissors.connect(player2).joinGame(0);

        await rockPaperScissors.connect(player1).makeMove(0, 1); // Player 1: Paper
        await rockPaperScissors.connect(player2).makeMove(0, 0); // Player 2: Rock

        await rockPaperScissors.connect(player1).withdrawWinnings();

        const balance = await usdt.balanceOf(player1.address);
        expect(balance).to.equal(ethers.utils.parseEther("510")); // Initial 500 + 20 winnings - 10 stake
    });
});
