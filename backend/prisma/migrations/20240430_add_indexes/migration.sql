-- CreateIndex
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");

-- CreateIndex
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");

-- CreateIndex
CREATE INDEX "Course_lecturerId_idx" ON "Course"("lecturerId");

-- CreateIndex
CREATE INDEX "Semester_academicSessionId_idx" ON "Semester"("academicSessionId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_courseId_idx" ON "Grade"("courseId");

-- CreateIndex
CREATE INDEX "Grade_status_idx" ON "Grade"("status");

-- CreateIndex
CREATE INDEX "Grade_semesterId_idx" ON "Grade"("semesterId");

-- CreateIndex
CREATE INDEX "Grade_studentId_status_idx" ON "Grade"("studentId", "status");

-- CreateIndex
CREATE INDEX "GradeAuditLog_gradeId_idx" ON "GradeAuditLog"("gradeId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_userId_idx" ON "GradeAuditLog"("userId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_timestamp_idx" ON "GradeAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "SystemAuditLog_userId_idx" ON "SystemAuditLog"("userId");

-- CreateIndex
CREATE INDEX "SystemAuditLog_action_idx" ON "SystemAuditLog"("action");

-- CreateIndex
CREATE INDEX "SystemAuditLog_timestamp_idx" ON "SystemAuditLog"("timestamp");
