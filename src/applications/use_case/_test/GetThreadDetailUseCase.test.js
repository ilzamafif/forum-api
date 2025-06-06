const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const ThreadDetail = require('../../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../../Domains/replies/entities/ReplyDetail');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThread = {
      id: threadId,
      title: 'A Thread',
      body: 'Thread body',
      username: 'user-123',
      date: '2023-01-01',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'user-123',
        date: '2023-01-02',
        content: 'A comment',
        deleted_at: null,
      },
      {
        id: 'comment-456',
        username: 'user-456',
        date: '2023-01-03',
        content: 'Another comment',
        deleted_at: '2023-01-04',
      },
    ];

    const mockReplies = [
      {
        id: 'reply-123',
        username: 'user-789',
        date: '2023-01-05',
        content: 'A reply',
        deleted_at: null,
      },
      {
        id: 'reply-456',
        username: 'user-321',
        date: '2023-01-06',
        content: 'Another reply',
        deleted_at: '2023-01-07',
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve(mockReplies));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(threadDetail).toBeInstanceOf(ThreadDetail);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledTimes(1);

    // Check thread details
    expect(threadDetail.id).toEqual(mockThread.id);
    expect(threadDetail.title).toEqual(mockThread.title);
    expect(threadDetail.body).toEqual(mockThread.body);
    expect(threadDetail.username).toEqual(mockThread.username);
    expect(threadDetail.date).toEqual(mockThread.date);

    // Check comments
    expect(threadDetail.comments).toHaveLength(2);
    expect(threadDetail.comments[0]).toBeInstanceOf(CommentDetail);
    expect(threadDetail.comments[1]).toBeInstanceOf(CommentDetail);

    // Check first comment (not deleted)
    expect(threadDetail.comments[0].content).toEqual('A comment');
    expect(threadDetail.comments[0].replies).toHaveLength(2);
    expect(threadDetail.comments[0].replies[0]).toBeInstanceOf(ReplyDetail);
    expect(threadDetail.comments[0].replies[0].content).toEqual('A reply');
    expect(threadDetail.comments[0].replies[1].content).toEqual('**balasan telah dihapus**');

    // Check second comment (deleted)
    expect(threadDetail.comments[1].content).toEqual('**komentar telah dihapus**');
    expect(threadDetail.comments[1].replies).toHaveLength(0);
  });

  it('should not fetch replies for deleted comments', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThread = {
      id: threadId,
      title: 'A Thread',
      body: 'Thread body',
      username: 'user-123',
      date: '2023-01-01',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'user-123',
        date: '2023-01-02',
        content: 'A comment',
        deleted_at: '2023-01-03',
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByCommentId = jest.fn();

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockReplyRepository.getRepliesByCommentId).not.toBeCalled();
    expect(threadDetail.comments[0].content).toEqual('**komentar telah dihapus**');
    expect(threadDetail.comments[0].replies).toHaveLength(0);
  });
});
