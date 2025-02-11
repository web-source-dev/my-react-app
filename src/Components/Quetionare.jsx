import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import questionsData from '../data/questions.json';
import optionsData from '../data/options.json';

const Quiz = () => {
  const initialQuestionIndex = questionsData.findIndex(q => q.questionName === "Q1");
  const [totalPoints, setTotalPoints] = useState(0);
  const [answersList, setAnswersList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [userData, setUserData] = useState({ name: '', surname: '', email: '' });
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false); // For smooth transitions
  const [pdf, setPdf] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false); // New state for form submission
  const [loading, setLoading] = useState(false); // New state for loading screen
  const [buttonLoading, setButtonLoading] = useState(false); // New state for button loading
  console.log("pdf", pdf);

  // Load options for the current question
  const loadOptions = (questionName) => {
    return optionsData.filter(opt => opt.questionName === questionName);
  };

  // Handle answer selection
  const handleOptionSelection = (selectedOption) => {
    setTotalPoints(prevPoints => prevPoints + selectedOption.points);

    setAnswersList(prevAnswers => [
      ...prevAnswers,
      { questionName: questionsData[currentQuestionIndex].questionText, selectedAnswer: selectedOption.optionText, points: selectedOption.points }
    ]);

    // Set transition effect before loading the next question
    setQuestionTransition(true);

    // Load next question or finish quiz
    setTimeout(() => {
      if (selectedOption.followUpQuestion) {
        const nextQuestionIndex = questionsData.findIndex(q => q.questionName === selectedOption.followUpQuestion);
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        const nextQuestion = questionsData.find(q => q.questionName === selectedOption.nextQuestion);
        if (nextQuestion) {
          const nextQuestionIndex = questionsData.findIndex(q => q.questionName === selectedOption.nextQuestion);
          setCurrentQuestionIndex(nextQuestionIndex);
        } else {
          setLoading(true);
          setTimeout(() => {
            setQuizFinished(true);
            setLoading(false);
          }, 2000); // Reduced time
        }
      }
      setQuestionTransition(false);
    }, 700); // Reduced time
  };

  // Handle form submission
  const submitUserDetails = async () => {
    setButtonLoading(true);
    try {
      const userDataToSubmit = {
        userName: userData.name,
        userSurname: userData.surname,
        userEmail: userData.email,
        answers: answersList,
        totalPoints: totalPoints
      };

      console.log("userDataToSubmit", userDataToSubmit);
      const response = await axios.post('https://ha-kx04.onrender.com/api/submitUserData', userDataToSubmit);
      console.log("Response:", response);
      setPdf(response.data.data.pdfUrl); // Update to use response.data.data.pdfUrl
      setFormSubmitted(true); // Set form submitted state
      // Send response data to parent Wix site
      window.parent.postMessage({ type: "quizSubmission", data: response.data }, "*");  
    } catch (error) {
      console.error("Error submitting data:", error);
      // Send error message to parent Wix site
      window.parent.postMessage({ type: "quizSubmissionError", error: error.message }, "*");
    } finally {
      setButtonLoading(false);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000); // Reduced time
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (formSubmitted) {
    return (
      <div className="quiz-container thank-you-container">
        <h2>Thank You for Submitting Your Responses!</h2>
        <p>We truly appreciate your time and effort in completing this questionnaire. Your answers will help you gain better insights into your health and daily habits.</p>
        <p>Maintaining a healthy lifestyle starts with awareness and small, consistent changes. Whether it's better sleep, mindful eating, or staying active, every step counts!</p>
        <p>We encourage you to reflect on your responses and take actionable steps toward a healthier and more balanced life.</p>
        <p>Stay motivated, take care of yourself, and remember—your well-being matters!</p>
        <p><strong>Looking for more insights?</strong> Stay tuned for personalized tips and recommendations based on your responses.</p>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="quiz-container thank-you-container">
        <h2>Please Provide the Following Details</h2>
        <form onSubmit={(e) => { e.preventDefault(); submitUserDetails(); }}>
          <input type="text" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} placeholder="Your Name" required />
          <input type="text" value={userData.surname} onChange={(e) => setUserData({ ...userData, surname: e.target.value })} placeholder="Your Surname" required />
          <input type="email" value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} placeholder="Your Email" required />
          <button type="submit" style={{ textAlign: 'center' }} disabled={buttonLoading}>
            {buttonLoading ? <div className="loading-spinner button-spinner"></div> : 'Submit'}
          </button>
        </form>
      </div>
    );
  }

  const currentQuestion = questionsData[currentQuestionIndex];
  const totalQuestions = questionsData.length;
  const progressValue = (currentQuestion.questionNumber / totalQuestions) * 100;

  return (
    <div className="quiz-container">
      <div className={`progress-bar ${questionTransition ? 'fade-out' : 'fade-in'}`}>
        <progress value={progressValue} max="100"></progress>
      </div>
      
      <div className={`question-container ${questionTransition ? 'fade-out' : 'fade-in'}`}>
        <div className="chapter-name">{currentQuestion.chName}</div>
        <h1>{currentQuestion.questionText}</h1>
        <div className="options-container">
          {loadOptions(currentQuestion.questionName).map(option => (
            <button key={option.optionText} onClick={() => handleOptionSelection(option)}>
              {option.optionText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
