import mongoose from "mongoose";
import connectDB from "../utils/db";

import StudyGroup from "../models/studyGroup.model";
import GroupGoal from "../models/groupGoal.model";
import GroupMemberActivity from "../models/groupMemberActivity.model";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const subjectIds = [
  "64f1a0f3d5f5b2b1c1a00101",
  "64f1a0f3d5f5b2b1c1a00102",
  "64f1a0f3d5f5b2b1c1a00103",
  "64f1a0f3d5f5b2b1c1a00104",
];

const questionIds = [
  "6a08a4d257a3c99981a7afad",
  "6a08a4d257a3c99981a7afae",
  "6a08a4d257a3c99981a7afaf",
  "6a08a4d257a3c99981a7afb0",
  "6a0719dee1415af1fcc1b14a",
  "6a08a4d257a3c99981a7afb1",
  "6a08a4d257a3c99981a7afb2",
  "6a08a4d257a3c99981a7afb3",
  "6a08a4d257a3c99981a7afb4",
  "6a08a4d257a3c99981a7afb5",
  "6a0719dee1415af1fcc1b14b",
  "6a0719dee1415af1fcc1b14c",
  "6a0719dee1415af1fcc1b14d",
  "6a0719dee1415af1fcc1b14e",
  "6a0719dee1415af1fcc1b14f",
];

const groupIds = [
  "6a08ace98aade3c8d2ad4eea",
  "6a08ace98aade3c8d2ad4eec",
];

const groupGoalIds = [
  "6a08ace98aade3c8d2ad5001",
  "6a08ace98aade3c8d2ad5002",
];

const userIds = [
  "6a08ace98aade3c8d2ad4ee6",
  "6a08ace98aade3c8d2ad4ee7",
  "6a08ace98aade3c8d2ad4ee8",
  "6a08ace98aade3c8d2ad4ee9",
];

const statuses = ["solved", "correct"];

async function seed() {
  await connectDB();

  console.log("Cleaning old data...");

  await GroupMemberActivity.deleteMany({
    groupId: {
      $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  });

  await GroupGoal.deleteMany({
    _id: {
      $in: groupGoalIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  });

  await StudyGroup.deleteMany({
    _id: {
      $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  });

  console.log("Creating fixed groups...");

  await StudyGroup.insertMany([
    {
      _id: new mongoose.Types.ObjectId(groupIds[0]),
      name: "Morning Problem Solvers",
      creatorId: new mongoose.Types.ObjectId(userIds[0]),
      members: [
        new mongoose.Types.ObjectId(userIds[1]),
        new mongoose.Types.ObjectId(userIds[2]),
      ],
      activeGoalId: new mongoose.Types.ObjectId(groupGoalIds[0]),
    },
    {
      _id: new mongoose.Types.ObjectId(groupIds[1]),
      name: "Weekly Revision Crew",
      creatorId: new mongoose.Types.ObjectId(userIds[3]),
      members: [
        new mongoose.Types.ObjectId(userIds[0]),
        new mongoose.Types.ObjectId(userIds[1]),
      ],
      activeGoalId: new mongoose.Types.ObjectId(groupGoalIds[1]),
    },
  ]);

  console.log("Creating fixed goals...");

  await GroupGoal.insertMany([
    {
      _id: new mongoose.Types.ObjectId(groupGoalIds[0]),
      groupId: new mongoose.Types.ObjectId(groupIds[0]),
      title: "Solve 20 math and physics questions",
      subjectIds: [subjectIds[0], subjectIds[1]],
      metric: "questionsSolved",
      totalQuestions: 20,
      goalType: "deadline",
      startDate: daysAgo(7),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      questionsSolved: 4,
      status: "active",
    },
    {
      _id: new mongoose.Types.ObjectId(groupGoalIds[1]),
      groupId: new mongoose.Types.ObjectId(groupIds[1]),
      title: "Weekly chemistry and biology streak",
      subjectIds: [subjectIds[2], subjectIds[3]],
      metric: "questionsSolved",
      totalQuestions: 15,
      goalType: "recurring",
      startDate: daysAgo(21),
      frequency: "weekly",
      questionsSolved: 2,
      lastResetAt: daysAgo(7),
      status: "active",
    },
  ]);

  console.log("Generating activities...");

  const TOTAL_ACTIVITIES = 5000;

  const activities: any[] = [];

  for (let i = 0; i <= TOTAL_ACTIVITIES; i++) {
    const randomGroupIndex = Math.floor(Math.random() * 2);

    const randomUser =
      userIds[Math.floor(Math.random() * userIds.length)];

    const randomQuestion =
      questionIds[Math.floor(Math.random() * questionIds.length)];

    const randomSubject =
      subjectIds[Math.floor(Math.random() * subjectIds.length)];

    const randomStatus =
      statuses[Math.floor(Math.random() * statuses.length)];

    activities.push({
      groupId: new mongoose.Types.ObjectId(
        groupIds[randomGroupIndex]
      ),

      goalId: new mongoose.Types.ObjectId(
        groupGoalIds[randomGroupIndex]
      ),

      userId: new mongoose.Types.ObjectId(randomUser),

      questionId: new mongoose.Types.ObjectId(randomQuestion),

      subjectId: randomSubject,

      status: randomStatus,

      timeSpent: Math.floor(Math.random() * 1200) + 30,

      activityDate: daysAgo(
        Math.floor(Math.random() * 60)
      ),

      countedTowardsGoal: true,

      notCountedReason: null,
    });

    if (activities.length === 5000) {
      await GroupMemberActivity.insertMany(activities);

      console.log(`Inserted ${i + 1} activities`);

      activities.length = 0;
    }
  }

  if (activities.length > 0) {
    await GroupMemberActivity.insertMany(activities);
  }

  console.log("Performance seed completed.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });