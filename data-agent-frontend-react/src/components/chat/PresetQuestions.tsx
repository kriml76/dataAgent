import React, { useState, useEffect } from 'react';
import { MessageOutlined, ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import presetQuestionService from '@/services/presetQuestion';
import type { PresetQuestion } from '@/services/presetQuestion';
import './PresetQuestions.css';

interface PresetQuestionsProps {
  agentId: number;
  onQuestionClick: (question: string) => void;
}

const PresetQuestions: React.FC<PresetQuestionsProps> = ({ agentId, onQuestionClick }) => {
  const [questions, setQuestions] = useState<PresetQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const activeQuestions = questions.filter((q) => q.isActive !== false);

  const loadPresetQuestions = async () => {
    setLoading(true);
    try {
      const data = await presetQuestionService.list(agentId);
      setQuestions(data);
    } catch (error) {
      console.error('加载预设问题失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (question: PresetQuestion) => {
    if (onQuestionClick) {
      onQuestionClick(question.question);
    }
  };

  useEffect(() => {
    if (agentId) {
      loadPresetQuestions();
    }
  }, [agentId]);

  return (
    <div className="preset-questions-wrapper">
      <div className="preset-questions-container">
        <div className="questions-header">
          <MessageOutlined className="header-icon" />
          <span className="header-title">预设问题</span>
        </div>

        {loading && (
          <div className="questions-loading">
            <LoadingOutlined className="loading-icon" />
            <span>加载中...</span>
          </div>
        )}

        {!loading && activeQuestions.length === 0 && (
          <div className="questions-empty">
            <span>暂无预设问题</span>
          </div>
        )}

        {!loading && activeQuestions.length > 0 && (
          <div className="questions-list">
            {activeQuestions.map((question) => (
              <div
                key={question.id}
                className="question-item"
                onClick={() => handleQuestionClick(question)}
              >
                <span className="question-text">{question.question}</span>
                <ArrowRightOutlined className="question-arrow" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetQuestions;
