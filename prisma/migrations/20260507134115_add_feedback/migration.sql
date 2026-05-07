-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "bookTitle" TEXT NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "learnings" TEXT,
    "wouldRecommend" BOOLEAN,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_loanId_key" ON "Feedback"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_token_key" ON "Feedback"("token");
