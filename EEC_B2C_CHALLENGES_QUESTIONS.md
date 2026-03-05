# EEC B2C - Problem-Focused Questions (Development Challenges)

## 1. Requirement and Planning Challenges
1. Which module requirements changed the most during development, and why?
2. At which stage did role-wise access rules become complex (Student/Teacher/Admin), and how did you resolve conflicts?
3. Which feature took longer than estimated due to unclear requirements?
4. How did you decide module priority when multiple parts were blocked?

## 2. Authentication and Authorization Challenges
5. What problems did you face while implementing JWT-based authentication?
6. Where did token expiry handling cause issues in frontend or backend flows?
7. Which routes were most sensitive for role-based protection, and why?
8. Did you face any security gap due to missing middleware on update/delete endpoints?

## 3. Database and Data Modeling Challenges
9. Which MongoDB schema was hardest to design and normalize?
10. Where did you face difficulty in mapping `class`, `board`, `subject`, and `topic` consistently?
11. How did you handle old and new profile fields (`class` vs `className`) without breaking existing users?
12. Which query became slow as data volume increased, and what was the fix?

## 4. Question Bank and Exam Challenges
13. Which question type implementation was most difficult (MCQ, cloze, match, essay), and why?
14. Where did validation fail while creating questions from different forms?
15. Which part of exam attempt submission had the highest risk of data inconsistency?
16. How did you prevent unauthorized access to other users' exam results?
17. What challenge did you face in generating leaderboard/class rank correctly?

## 5. AI Integration Challenges
18. Which issue appeared most in PDF-to-question generation (poor text extraction, formatting noise, low context)?
19. How did you control quality when AI-generated questions were incorrect or ambiguous?
20. Where did AI latency impact user experience, and how did you reduce it?
21. What fallback did you implement when AI service failed?

## 6. Study Materials and Commerce Challenges
22. Which challenge occurred in secure PDF access after purchase verification?
23. Where did Razorpay signature verification fail initially, and what was corrected?
24. How did you handle duplicate purchase attempts for the same material?
25. Which part of wallet and coins redemption was most error-prone?
26. How did you ensure gift card inventory does not oversell or mismatch status?

## 7. Notifications, Push, and Chat Challenges
27. What issues did you face in browser push subscription flow across devices/browsers?
28. Where did notification read/unread synchronization break?
29. Which Socket.IO event handling issue caused duplicate or missed chat messages?
30. How did you moderate or control chat misuse while preserving performance?

## 8. Deployment and Environment Challenges
31. Which environment variable mismatch caused production failures?
32. Where did CORS configuration break for local vs deployed frontend domains?
33. What deployment issue happened with file upload/cloud services?
34. Which keep-alive, scheduler, or background task issue was hardest to debug?

## 9. Testing and Quality Challenges
35. Which modules lacked enough test coverage and increased risk?
36. What bugs were repeatedly reported by users during UAT?
37. Which edge case in role-based navigation was discovered late?
38. How did you verify payment, subscription, and unlock-stage logic end-to-end?

## 10. Reflection and Improvement Questions
39. If you rebuild this project, which module architecture would you redesign first?
40. Which single technical decision had the biggest positive impact?
41. Which problem is still partially unresolved and needs future improvement?
42. What coding standards or review process would have prevented most issues?

## Bonus: Short Viva Questions (Quick Round)
43. In one sentence, what was the toughest backend bug?
44. In one sentence, what was the toughest frontend bug?
45. Which third-party integration was most unstable and why?
46. Which user role flow caused maximum edge cases?
47. Which feature had the highest maintenance cost after release?
48. Which module gave the best learning outcome during internship?
