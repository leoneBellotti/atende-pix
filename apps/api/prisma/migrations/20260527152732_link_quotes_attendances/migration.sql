-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
