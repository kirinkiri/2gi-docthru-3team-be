import challengeRepository from "../repositories/challengeRepository.js";
import formatDate from "../utils/formatDate.js";

async function get({ page, limit, filters }) {
  const skip = (page - 1) * limit;
  const take = limit;
  const { field, type, progress, keyword } = filters;

  const where = {
    AND: [
      field && field.length > 0 ? { field: { in: field } } : {}, 
      type ? { docType: type } : {},
      progress !== undefined ? { progress } : {},
      keyword ? {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } }
        ]
      } : {},
      { applications: { status: "Accepted" } },
    ]
  };

  const challenges = await challengeRepository.get({ where, skip, take });

  const totalCount = await challengeRepository.count({ where });

  return { list: challenges, totalCount };
};

async function getById(id) {
  const challenge = await challengeRepository.getById(id);

  if (!challenge) {
    const error = new Error("존재하지 않는 챌린지입니다.");
    error.status = 404;
    throw error;
  }

  const worksList = challenge.works.map((work) => ({
    id: work.id,
    nickname: work.user.nickname,
    grade: work.user.grade,
    submittedAt: work.submittedAt,
    likeCount: work._count.likes
  }));

  const application = challenge.applications ? {
    // appliedAt: challenge.applications.appliedAt,
    id: challenge.applications.id,
    status: challenge.applications.status,
    user: {
      id: challenge.applications.user.id,
      nickname: challenge.applications.user.nickname,
      grade: challenge.applications.user.grade
    }
  } : null;

  return {
    ...challenge,
    applications: application,
    works: {
      list: worksList,
      totalCount: challenge._count.works,
    },
    _count: undefined
  };
}

async function create(data) {
  const { title, docUrl, field, type, deadLine, maxParticipants, description, userId } = data;
  
  const formattedDate = formatDate(deadLine);

  const challengeData = {
    title, docUrl, field, docType: type, deadLine: formattedDate, maxParticipants, description, userId
  };

  return await challengeRepository.create(challengeData);
};

async function update(id, data, user) {
  const challenge = await challengeRepository.findById(id);

  if (!challenge) {
    const error = new Error("존재하지 않는 챌린지입니다.");
    error.status = 404;
    throw error;
  }

  const isOwner = challenge.applications.userId === user.id;
  const isAdmin = user.role === 'Admin';

  if (!isOwner && !isAdmin) {
    const error = new Error("권한이 없습니다.");
    error.status = 403;
    throw error;
  }

  if (data.deadLine) {
    data.deadLine = formatDate(data.deadLine);
  }

  return await challengeRepository.update(id, data);
}

async function invalidate(id, invalidationComment) {
  const invalidatedAt = new Date();

  return await challengeRepository.invalidate(id, invalidationComment, invalidatedAt);
}

export default { get, getById, create, update, invalidate };