-- CreateTable
CREATE TABLE "AiChatSummary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiChatSummary_userId_key" ON "AiChatSummary"("userId");

-- AddForeignKey
ALTER TABLE "AiChatSummary" ADD CONSTRAINT "AiChatSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
