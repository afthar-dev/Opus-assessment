import { prisma } from "../lib/prisma.ts";

export const getUploadedFiles = async (page: number, limit: number) => {
  try {
    const [files, total] = await Promise.all([
      prisma.upload.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          uploadedAt: "desc",
        },
      }),
      prisma.upload.count(),
    ]);

    return {
      files,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get uploaded files");
  }
};

export const getUploadedFileById = async (id: string) => {
  try {
    const file = await prisma.upload.findUnique({
      where: {
        id,
      },
      include: {
        report: true,

        quarantineRows: {
          include: {
            errors: true,
          },
          orderBy: {
            rowNumber: "asc",
          },
        },
      },
    });

    if (!file) {
      throw new Error("Upload not found");
    }

    return file;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get uploaded file");
  }
};

export const getUploadRecordsService = async (
  uploadId: string,
  page: number = 1,
  limit: number = 20,
) => {
  const upload = await prisma.upload.findUnique({
    where: {
      id: uploadId,
    },
    select: {
      id: true,
      fileType: true,
    },
  });

  if (!upload) {
    throw new Error("Upload not found");
  }

  const skip = (page - 1) * limit;

  switch (upload.fileType) {
    case "INVOICE": {
      const [records, total] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            uploadId,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.invoice.count({
          where: {
            uploadId,
          },
        }),
      ]);

      return {
        fileType: upload.fileType,
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    case "LESSON_LOG": {
      const [records, total] = await Promise.all([
        prisma.lessonLog.findMany({
          where: {
            uploadId,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.lessonLog.count({
          where: {
            uploadId,
          },
        }),
      ]);

      return {
        fileType: upload.fileType,
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    case "TUTOR_ASSIGNMENT": {
      const [records, total] = await Promise.all([
        prisma.tutorAssignment.findMany({
          where: {
            uploadId,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.tutorAssignment.count({
          where: {
            uploadId,
          },
        }),
      ]);

      return {
        fileType: upload.fileType,
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    default:
      throw new Error(`Unsupported file type: ${upload.fileType}`);
  }
};
